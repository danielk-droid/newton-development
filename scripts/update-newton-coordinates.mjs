import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "data", "newton-source.json");
const PUBLIC_PATH = path.join(ROOT, "data", "public-projects.ts");
const TRANSPORT_PATH = path.join(ROOT, "data", "transportation-projects.ts");
const OUTPUT_PATH = path.join(ROOT, "data", "project-coordinates.json");
const STATUS_PATH = path.join(ROOT, "data", "coordinate-collection-status.json");

const GIS_BASE = "https://gisweb.newtonma.gov/server/rest/services/Data/MapServer";
const ADDRESS_LAYER = `${GIS_BASE}/12/query`;
const FACILITY_LAYER = `${GIS_BASE}/13/query`;
const STREET_LAYER = `${GIS_BASE}/15/query`;
const CITY_REFERENCE_ADDRESS = "1000 Commonwealth Avenue";
const MIN_EXACT_LOCATION_RATIO = 0.25;

const STREET_TYPES = [
  "Street", "St", "Road", "Rd", "Avenue", "Ave", "Drive", "Dr", "Parkway", "Pkwy",
  "Place", "Pl", "Way", "Lane", "Ln", "Court", "Ct", "Circle", "Cir", "Terrace",
  "Ter", "Boulevard", "Blvd", "Highway", "Hwy", "Roadway", "Rte", "Route",
];
const STREET_TYPE_PATTERN = STREET_TYPES.join("|");

// Semantic hints are resolved through official GIS geometry; they are not stored coordinates.
const LOCATION_HINTS = {
  "newton-corner-improvements": ["Washington Street", "Centre Street"],
};

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function quote(value) {
  return String(value).replace(/'/g, "''");
}

function parseProjects(source) {
  const lines = source.split(/\r?\n/);
  const projects = [];
  for (let i = 0; i < lines.length; i += 1) {
    const id = lines[i].match(/^\s*id:\s*"([^"]+)"/)?.[1];
    if (!id) continue;
    let name = null;
    let address = null;
    for (let j = i + 1; j < Math.min(i + 20, lines.length); j += 1) {
      if (/^\s*id:\s*"/.test(lines[j])) break;
      name ??= lines[j].match(/^\s*name:\s*"([^"]+)"/)?.[1] ?? null;
      address ??= lines[j].match(/^\s*address:\s*"([^"]+)"/)?.[1] ?? null;
    }
    if (name && address) projects.push({ id, name, address });
  }
  return projects;
}

function mergeProjects(...groups) {
  const map = new Map();
  for (const project of groups.flat()) {
    if (project?.id && project?.name && project?.address) map.set(project.id, project);
  }
  return [...map.values()];
}

function extractAddressCandidates(address) {
  const pattern = new RegExp(
    `\\b(\\d{1,5})(?:-\\d{1,5})?\\s+([A-Za-z0-9.'-]+(?:\\s+[A-Za-z0-9.'-]+){0,6}?)\\s+(${STREET_TYPE_PATTERN})\\b`,
    "gi",
  );
  const candidates = [];
  for (const match of String(address).matchAll(pattern)) {
    const streetName = match[2].trim();
    const type = match[3];
    const key = `${Number(match[1])}|${normalize(streetName)}|${normalize(type)}`;
    if (!candidates.some((item) => item.key === key)) {
      candidates.push({ number: Number(match[1]), streetName, type, key });
    }
  }
  return candidates;
}

function extractStreetName(value) {
  const match = String(value).match(
    new RegExp(`\\b([A-Za-z0-9.'-]+(?:\\s+[A-Za-z0-9.'-]+){0,5})\\s+(${STREET_TYPE_PATTERN})\\b`, "i"),
  );
  return match ? `${match[1].trim()} ${match[2]}` : null;
}

function extractStreetCandidates(address) {
  const candidates = [];
  const add = (value) => {
    const street = extractStreetName(value);
    if (street && !candidates.some((item) => normalize(item) === normalize(street))) candidates.push(street);
  };

  for (const part of String(address).split(/\s*(?:&|\bat\b|\band\b|\/)\s*/i)) add(part);
  for (const match of String(address).matchAll(new RegExp(`\\b[A-Za-z0-9.'-]+(?:\\s+[A-Za-z0-9.'-]+){0,5}\\s+(?:${STREET_TYPE_PATTERN})\\b`, "gi"))) {
    add(match[0]);
  }
  return candidates;
}

async function query(url, where, outFields) {
  const params = new URLSearchParams({
    where,
    outFields,
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "200",
    f: "json",
  });
  const response = await fetch(`${url}?${params}`, {
    headers: { "User-Agent": "Newton Development GIS updater" },
  });
  if (!response.ok) throw new Error(`Official Newton GIS HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message ?? "Official Newton GIS query failed");
  return data.features ?? [];
}

async function assertOfficialLayersAvailable() {
  for (const [name, url] of [["address", ADDRESS_LAYER], ["facility", FACILITY_LAYER], ["street", STREET_LAYER]]) {
    await query(url, "1=1", "OBJECTID");
    console.log(`Official Newton GIS ${name} layer is available.`);
  }
}

function geometryPoint(feature) {
  const x = Number(feature?.geometry?.x);
  const y = Number(feature?.geometry?.y);
  return Number.isFinite(x) && Number.isFinite(y) ? { lat: y, lon: x } : null;
}

function geometryPaths(feature) {
  return (feature?.geometry?.paths ?? [])
    .map((path) => path
      .filter((point) => Array.isArray(point) && point.length >= 2)
      .map((point) => [Number(point[0]), Number(point[1])])
      .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat)))
    .filter((path) => path.length >= 2);
}

function geometryPoints(feature) {
  return geometryPaths(feature).flat();
}

function segmentIntersection(a, b, c, d) {
  const denominator = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]);
  if (Math.abs(denominator) < 1e-12) return null;

  const determinantAB = a[0] * b[1] - a[1] * b[0];
  const determinantCD = c[0] * d[1] - c[1] * d[0];
  const x = (determinantAB * (c[0] - d[0]) - (a[0] - b[0]) * determinantCD) / denominator;
  const y = (determinantAB * (c[1] - d[1]) - (a[1] - b[1]) * determinantCD) / denominator;

  const within = (value, first, second) => value >= Math.min(first, second) - 1e-9 && value <= Math.max(first, second) + 1e-9;
  return within(x, a[0], b[0]) && within(y, a[1], b[1]) && within(x, c[0], d[0]) && within(y, c[1], d[1])
    ? [x, y]
    : null;
}

function closestPointOnSegment(point, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return a;
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared));
  return [a[0] + t * dx, a[1] + t * dy];
}

function closestPointsBetweenSegments(a, b, c, d) {
  const intersection = segmentIntersection(a, b, c, d);
  if (intersection) return { first: intersection, second: intersection, distance: 0 };

  const candidates = [
    { first: a, second: closestPointOnSegment(a, c, d) },
    { first: b, second: closestPointOnSegment(b, c, d) },
    { first: closestPointOnSegment(c, a, b), second: c },
    { first: closestPointOnSegment(d, a, b), second: d },
  ];
  return candidates.reduce((best, candidate) => {
    const distance = (candidate.first[0] - candidate.second[0]) ** 2 + (candidate.first[1] - candidate.second[1]) ** 2;
    return !best || distance < best.distance ? { ...candidate, distance } : best;
  }, null);
}

async function findAddresses(address) {
  const candidates = extractAddressCandidates(address);
  const points = [];
  for (const candidate of candidates) {
    const features = await query(
      ADDRESS_LAYER,
      `Number=${candidate.number} AND UPPER(StreetName)=UPPER('${quote(candidate.streetName)}') AND Status <> 'Inactive'`,
      "Number,NumberSuffix,StreetName,PostType,FullStName,Address,Status,LocationType",
    );
    const feature = features.find((item) => geometryPoint(item));
    if (feature) points.push({ point: geometryPoint(feature), address: feature.attributes?.Address ?? `${candidate.number} ${candidate.streetName}` });
  }
  return points;
}

async function findFacility(name) {
  const tokens = normalize(name).split(/\s+/).filter((token) => token.length >= 4 && !["project", "improvement", "improvements", "renovation", "facility", "facilities", "newton"].includes(token));
  if (!tokens.length) return null;

  const features = await query(FACILITY_LAYER, "1=1", "Name,Type");
  const scored = features
    .map((feature) => {
      const featureName = normalize(feature.attributes?.Name);
      const score = tokens.reduce((total, token) => total + (featureName.includes(token) ? 1 : 0), 0);
      return { feature, score };
    })
    .filter(({ feature, score }) => score > 0 && geometryPoint(feature))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < Math.max(1, Math.ceil(tokens.length / 3))) return null;
  return {
    ...geometryPoint(best.feature),
    matchedAddress: best.feature.attributes?.Name ?? name,
    method: "official-facility-point",
    exact: true,
  };
}

async function findStreetFeatures(name) {
  const street = extractStreetName(name) ?? name;
  const normalized = normalize(street);
  if (!normalized) return [];
  const exact = await query(STREET_LAYER, `UPPER(NAME)=UPPER('${quote(street)}')`, "NAME,OBJECTID");
  if (exact.length) return exact;
  return query(STREET_LAYER, `UPPER(NAME) LIKE UPPER('${quote(normalized)}%')`, "NAME,OBJECTID");
}

async function findStreet(name) {
  const features = await findStreetFeatures(name);
  const segments = features.flatMap(geometryPaths);
  if (!segments.length) return null;

  let longest = null;
  for (const path of segments) {
    for (let i = 1; i < path.length; i += 1) {
      const a = path[i - 1];
      const b = path[i];
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!longest || length > longest.length) longest = { a, b, length };
    }
  }
  if (!longest) return null;

  return {
    lat: (longest.a[1] + longest.b[1]) / 2,
    lon: (longest.a[0] + longest.b[0]) / 2,
    matchedAddress: extractStreetName(name) ?? name,
    method: "official-street-centerline-reference",
    exact: false,
  };
}

async function findIntersection(names) {
  if (names.length < 2) return null;
  const featureGroups = await Promise.all(names.slice(0, 2).map(findStreetFeatures));
  const pathGroups = featureGroups.map((features) => features.flatMap(geometryPaths));
  if (pathGroups.some((paths) => paths.length === 0)) return null;

  let best = null;
  for (const firstPath of pathGroups[0]) {
    for (let i = 1; i < firstPath.length; i += 1) {
      for (const secondPath of pathGroups[1]) {
        for (let j = 1; j < secondPath.length; j += 1) {
          const candidate = closestPointsBetweenSegments(firstPath[i - 1], firstPath[i], secondPath[j - 1], secondPath[j]);
          if (!best || candidate.distance < best.distance) best = candidate;
        }
      }
    }
  }

  if (!best) return null;
  // Coordinates are returned in WGS84 degrees. A gap larger than ~50m is not a credible intersection.
  const maxGapDegrees = 0.0005;
  if (best.distance > maxGapDegrees ** 2) return null;

  return {
    lat: (best.first[1] + best.second[1]) / 2,
    lon: (best.first[0] + best.second[0]) / 2,
    matchedAddress: names.slice(0, 2).join(" & "),
    method: "official-intersection-reference",
    exact: best.distance === 0,
  };
}

const source = JSON.parse(await fs.readFile(SOURCE_PATH, "utf8"));
const publicSource = await fs.readFile(PUBLIC_PATH, "utf8");
const transportSource = await fs.readFile(TRANSPORT_PATH, "utf8");
const projects = mergeProjects(source.projects ?? [], parseProjects(publicSource), parseProjects(transportSource));

if (projects.length === 0) throw new Error("Newton project catalog is empty; refusing to generate GIS coordinates.");
await assertOfficialLayersAvailable();

const resolved = [];
const unresolved = [];
let cityReference = null;

for (const project of projects) {
  try {
    let point = null;
    const addressPoints = await findAddresses(project.address);
    if (addressPoints.length === 1) {
      point = {
        ...addressPoints[0].point,
        matchedAddress: addressPoints[0].address,
        method: "official-address-point",
        exact: true,
      };
    } else if (addressPoints.length > 1) {
      point = {
        lat: addressPoints.reduce((sum, item) => sum + item.point.lat, 0) / addressPoints.length,
        lon: addressPoints.reduce((sum, item) => sum + item.point.lon, 0) / addressPoints.length,
        matchedAddress: addressPoints.map((item) => item.address).join("; "),
        method: "official-multi-address-reference",
        exact: false,
      };
    }

    if (!point) {
      const hintedNames = LOCATION_HINTS[project.id] ?? [];
      if (hintedNames.length >= 2) point = await findIntersection(hintedNames);
    }

    const names = extractStreetCandidates(project.address);
    if (!point && names.length >= 2) point = await findIntersection(names);
    if (!point && names.length === 1) point = await findStreet(names[0]);

    if (!point) point = await findFacility(project.name);

    if (!point && /^citywide$/i.test(project.address.trim())) {
      cityReference ??= await findAddresses(CITY_REFERENCE_ADDRESS);
      const reference = cityReference[0];
      if (reference) {
        point = {
          ...reference.point,
          matchedAddress: "Newton citywide reference",
          method: "official-citywide-reference",
          exact: false,
          scope: "citywide",
        };
      }
    }

    if (point && Number.isFinite(point.lat) && Number.isFinite(point.lon)) {
      resolved.push({ id: project.id, ...point });
    } else {
      unresolved.push({ id: project.id, address: project.address, reason: "No official Newton GIS match" });
    }
  } catch (error) {
    throw new Error(`GIS lookup failed for ${project.id}; refusing to publish a partial coordinate refresh: ${error instanceof Error ? error.message : "Unknown GIS error"}`);
  }
}

if (resolved.length === 0) throw new Error("Official Newton GIS returned no project coordinates; refusing to publish coordinate data.");
if (unresolved.length > 0) {
  throw new Error(`Official Newton GIS did not resolve ${unresolved.length} catalog projects: ${unresolved.map((item) => item.id).join(", ")}`);
}

const exactLocations = resolved.filter((item) => item.exact).length;
if (exactLocations / projects.length < MIN_EXACT_LOCATION_RATIO) {
  throw new Error(`Only ${exactLocations} of ${projects.length} coordinates are exact official GIS matches; refusing a suspiciously low-quality refresh.`);
}

const badCityFallbacks = resolved.filter((item) => item.method === "official-citywide-reference" && item.scope !== "citywide");
if (badCityFallbacks.length) {
  throw new Error(`Non-citywide projects were assigned the citywide reference: ${badCityFallbacks.map((item) => item.id).join(", ")}`);
}

const checkedAt = new Date().toISOString();
await fs.writeFile(
  OUTPUT_PATH,
  `${JSON.stringify({
    checkedAt,
    source: `${GIS_BASE}/12, ${GIS_BASE}/13, and ${GIS_BASE}/15`,
    sourceDescription: "City of Newton GIS address points, city facilities, and street centerlines",
    projects: resolved,
    unresolved,
  }, null, 2)}\n`,
  "utf8",
);

await fs.writeFile(
  STATUS_PATH,
  `${JSON.stringify({
    checkedAt,
    source: `${GIS_BASE}/12, ${GIS_BASE}/13, and ${GIS_BASE}/15`,
    totalProjects: projects.length,
    resolvedProjects: resolved.length,
    unresolvedProjects: unresolved.length,
    exactLocations,
    referenceLocations: resolved.filter((item) => !item.exact).length,
    failures: unresolved,
  }, null, 2)}\n`,
  "utf8",
);

console.log(`Resolved ${resolved.length} of ${projects.length} catalog projects from official Newton GIS.`);
console.log(`Exact locations: ${exactLocations}.`);
console.log(`Reference locations: ${resolved.filter((item) => !item.exact).length}.`);
console.log(`Unresolved: ${unresolved.length}.`);
