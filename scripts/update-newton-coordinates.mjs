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
const PAGE_SIZE = 1000;
const MIN_EXACT_LOCATION_RATIO = 0.25;

const STREET_TYPES = [
  "Street", "St", "Road", "Rd", "Avenue", "Ave", "Drive", "Dr", "Parkway", "Pkwy",
  "Place", "Pl", "Way", "Lane", "Ln", "Court", "Ct", "Circle", "Cir", "Terrace",
  "Ter", "Boulevard", "Blvd", "Highway", "Hwy", "Roadway", "Rte", "Route",
];
const STREET_TYPE_PATTERN = STREET_TYPES.join("|");
const STREET_TYPE_ALIASES = new Map([
  ["street", "st"], ["st", "st"], ["road", "rd"], ["rd", "rd"],
  ["avenue", "ave"], ["ave", "ave"], ["drive", "dr"], ["dr", "dr"],
  ["parkway", "pkwy"], ["pkwy", "pkwy"], ["place", "pl"], ["pl", "pl"],
  ["lane", "ln"], ["ln", "ln"], ["court", "ct"], ["ct", "ct"],
  ["circle", "cir"], ["cir", "cir"], ["terrace", "ter"], ["ter", "ter"],
  ["boulevard", "blvd"], ["blvd", "blvd"], ["highway", "hwy"], ["hwy", "hwy"],
  ["roadway", "roadway"], ["route", "rte"], ["rte", "rte"],
]);

// These are semantic descriptions, not stored coordinates. Each hint is resolved against
// current official Newton GIS street geometry on every refresh.
const LOCATION_HINTS = {
  "newton-corner-improvements": ["Washington Street", "Centre Street"],
};

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[.,'’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalStreet(value) {
  const tokens = normalize(value).split(" ").filter(Boolean);
  if (!tokens.length) return "";
  const last = tokens[tokens.length - 1];
  if (STREET_TYPE_ALIASES.has(last)) tokens[tokens.length - 1] = STREET_TYPE_ALIASES.get(last);
  return tokens.join(" ");
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
    `\\b(\\d{1,5})(?:-\\d{1,5})?\\s+([A-Za-z0-9.'’-]+(?:\\s+[A-Za-z0-9.'’-]+){0,5}?)\\s+(${STREET_TYPE_PATTERN})\\b`,
    "gi",
  );
  const candidates = [];
  for (const match of String(address).matchAll(pattern)) {
    const streetName = `${match[2].trim()} ${match[3]}`;
    const key = `${Number(match[1])}|${canonicalStreet(streetName)}`;
    if (!candidates.some((item) => item.key === key)) {
      candidates.push({ number: Number(match[1]), streetName, key });
    }
  }
  return candidates;
}

function extractStreetName(value) {
  const match = String(value).match(
    new RegExp(`\\b([A-Za-z0-9.'’-]+(?:\\s+[A-Za-z0-9.'’-]+){0,5})\\s+(${STREET_TYPE_PATTERN})\\b`, "i"),
  );
  return match ? `${match[1].trim()} ${match[2]}` : null;
}

function extractStreetCandidates(address) {
  const candidates = [];
  const add = (value) => {
    const street = extractStreetName(value);
    if (street && !candidates.some((item) => canonicalStreet(item) === canonicalStreet(street))) candidates.push(street);
  };

  for (const part of String(address).split(/\s*(?:&|\bat\b|\band\b|\/)\s*/i)) add(part);
  for (const match of String(address).matchAll(new RegExp(`\\b[A-Za-z0-9.'’-]+(?:\\s+[A-Za-z0-9.'’-]+){0,5}\\s+(?:${STREET_TYPE_PATTERN})\\b`, "gi"))) {
    add(match[0]);
  }
  return candidates;
}

async function query(url, where, outFields, { returnGeometry = true, offset = 0 } = {}) {
  const params = new URLSearchParams({
    where,
    outFields,
    returnGeometry: String(returnGeometry),
    outSR: "4326",
    resultRecordCount: String(PAGE_SIZE),
    resultOffset: String(offset),
    f: "json",
  });
  const response = await fetch(`${url}?${params}`, {
    headers: { "User-Agent": "Newton Development GIS updater" },
  });
  if (!response.ok) throw new Error(`Official Newton GIS HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message ?? "Official Newton GIS query failed");
  return data;
}

async function queryAll(url, where, outFields, { returnGeometry = true } = {}) {
  const features = [];
  let offset = 0;
  while (true) {
    const data = await query(url, where, outFields, { returnGeometry, offset });
    const page = data.features ?? [];
    features.push(...page);
    if (!data.exceededTransferLimit || page.length === 0) break;
    offset += page.length;
  }
  return features;
}

async function assertOfficialLayersAvailable() {
  for (const [name, url] of [["address", ADDRESS_LAYER], ["facility", FACILITY_LAYER], ["street", STREET_LAYER]]) {
    await query(url, "1=1", "OBJECTID", { returnGeometry: false });
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

function segmentIntersection(a, b, c, d) {
  const denominator = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]);
  if (Math.abs(denominator) < 1e-12) return null;
  const determinantAB = a[0] * b[1] - a[1] * b[0];
  const determinantCD = c[0] * d[1] - c[1] * d[0];
  const x = (determinantAB * (c[0] - d[0]) - (a[0] - b[0]) * determinantCD) / denominator;
  const y = (determinantAB * (c[1] - d[1]) - (a[1] - b[1]) * determinantCD) / denominator;
  const within = (value, first, second) => value >= Math.min(first, second) - 1e-9 && value <= Math.max(first, second) + 1e-9;
  return within(x, a[0], b[0]) && within(y, a[1], b[1]) && within(x, c[0], d[0]) && within(y, c[1], d[1]) ? [x, y] : null;
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

function buildStreetIndex(features) {
  const index = new Map();
  for (const feature of features) {
    const name = feature.attributes?.NAME;
    const key = canonicalStreet(name);
    if (!key || !geometryPaths(feature).length) continue;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(feature);
  }
  return index;
}

function buildAddressIndex(features) {
  const index = new Map();
  for (const feature of features) {
    const attrs = feature.attributes ?? {};
    const number = Number(attrs.Number);
    if (!Number.isFinite(number) || !geometryPoint(feature)) continue;
    const street = attrs.FullStName ?? `${attrs.StreetName ?? ""} ${attrs.PostType ?? ""}`;
    const key = `${number}|${canonicalStreet(street)}`;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(feature);
  }
  return index;
}

function scoreFacility(feature, tokens) {
  const attrs = feature.attributes ?? {};
  const haystack = normalize(`${attrs.Name ?? ""} ${attrs.Type ?? ""}`);
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function representativeStreetPoint(features) {
  const points = features.flatMap((feature) => geometryPaths(feature).flat());
  if (!points.length) return null;
  const lon = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const lat = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  return { lat, lon };
}

function streetFeatures(streetIndex, name) {
  return streetIndex.get(canonicalStreet(name)) ?? [];
}

function findStreetFromIndex(streetIndex, name) {
  const features = streetFeatures(streetIndex, name);
  const point = representativeStreetPoint(features);
  if (!point) return null;
  return {
    ...point,
    matchedAddress: extractStreetName(name) ?? name,
    method: "official-street-centerline-reference",
    exact: false,
  };
}

function findIntersectionFromIndex(streetIndex, names) {
  if (names.length < 2) return null;
  const first = streetFeatures(streetIndex, names[0]);
  const second = streetFeatures(streetIndex, names[1]);
  if (!first.length || !second.length) return null;

  let best = null;
  for (const firstFeature of first) {
    for (const firstPath of geometryPaths(firstFeature)) {
      for (let i = 1; i < firstPath.length; i += 1) {
        for (const secondFeature of second) {
          for (const secondPath of geometryPaths(secondFeature)) {
            for (let j = 1; j < secondPath.length; j += 1) {
              const candidate = closestPointsBetweenSegments(firstPath[i - 1], firstPath[i], secondPath[j - 1], secondPath[j]);
              if (!best || candidate.distance < best.distance) best = candidate;
            }
          }
        }
      }
    }
  }

  if (!best) return null;
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

function findAddressesFromIndex(addressIndex, address) {
  const candidates = extractAddressCandidates(address);
  const points = [];
  for (const candidate of candidates) {
    const features = addressIndex.get(`${candidate.number}|${canonicalStreet(candidate.streetName)}`) ?? [];
    const feature = features.find((item) => geometryPoint(item));
    if (feature) {
      points.push({
        point: geometryPoint(feature),
        address: feature.attributes?.Address ?? `${candidate.number} ${candidate.streetName}`,
      });
    }
  }
  return points;
}

function findFacilityFromIndex(facilities, name) {
  const tokens = normalize(name)
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !["project", "improvement", "improvements", "renovation", "facility", "facilities", "newton", "center", "centre"].includes(token));
  if (!tokens.length) return null;

  const scored = facilities
    .map((feature) => ({ feature, score: scoreFacility(feature, tokens) }))
    .filter(({ feature, score }) => score > 0 && geometryPoint(feature))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) return null;
  const minimum = tokens.length === 1 ? 1 : Math.max(1, Math.ceil(tokens.length / 3));
  if (best.score < minimum) return null;
  const second = scored[1];
  if (second && second.score === best.score && best.score === 1) return null;

  return {
    ...geometryPoint(best.feature),
    matchedAddress: best.feature.attributes?.Name ?? name,
    method: "official-facility-point",
    exact: true,
  };
}

const source = JSON.parse(await fs.readFile(SOURCE_PATH, "utf8"));
const publicSource = await fs.readFile(PUBLIC_PATH, "utf8");
const transportSource = await fs.readFile(TRANSPORT_PATH, "utf8");
const projects = mergeProjects(source.projects ?? [], parseProjects(publicSource), parseProjects(transportSource));

if (projects.length === 0) throw new Error("Newton project catalog is empty; refusing to generate GIS coordinates.");
await assertOfficialLayersAvailable();

console.log("Downloading official Newton GIS reference layers for local matching...");
const [addressFeatures, facilityFeatures, streetFeatures] = await Promise.all([
  queryAll(ADDRESS_LAYER, "1=1", "Number,NumberSuffix,StreetName,PostType,FullStName,Address,Status,LocationType"),
  queryAll(FACILITY_LAYER, "1=1", "*"),
  queryAll(STREET_LAYER, "1=1", "NAME,OBJECTID"),
]);

const addressIndex = buildAddressIndex(addressFeatures.filter((feature) => feature.attributes?.Status !== "Inactive"));
const streetIndex = buildStreetIndex(streetFeatures);
console.log(`Loaded ${addressFeatures.length} address points, ${facilityFeatures.length} facilities, and ${streetFeatures.length} street features.`);

const resolved = [];
const unresolved = [];
let cityReference = null;

for (const project of projects) {
  let point = null;
  const addressPoints = findAddressesFromIndex(addressIndex, project.address);
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

  const hintedNames = LOCATION_HINTS[project.id] ?? [];
  if (!point && hintedNames.length >= 2) point = findIntersectionFromIndex(streetIndex, hintedNames);

  const names = extractStreetCandidates(project.address);
  if (!point && names.length >= 2) point = findIntersectionFromIndex(streetIndex, names);
  if (!point && names.length === 1) point = findStreetFromIndex(streetIndex, names[0]);
  if (!point) point = findFacilityFromIndex(facilityFeatures, project.name);

  if (!point && /^citywide$/i.test(project.address.trim())) {
    cityReference ??= findAddressesFromIndex(addressIndex, CITY_REFERENCE_ADDRESS);
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
}

if (resolved.length === 0) throw new Error("Official Newton GIS returned no project coordinates; refusing coordinate refresh.");
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