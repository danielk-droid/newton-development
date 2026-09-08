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

// These are semantic location hints, not hand-entered map coordinates. The updater
// still resolves the actual point from the official Newton GIS street-centerline layer.
const LOCATION_HINTS = {
  "newton-corner-improvements": ["Washington Street", "Centre Street"],
};

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
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

function parseExactAddress(address) {
  const match = String(address).match(/\b(\d{1,5})(?:-\d{1,5})?\s+(.+?\b(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Parkway|Pkwy|Place|Pl|Way|Lane|Ln|Court|Ct|Circle|Cir|Terrace|Ter|Boulevard|Blvd|Highway|Hwy|Streets)\b)/i);
  if (!match) return null;
  const words = match[2].trim().split(/\s+/);
  const type = words.pop();
  return { number: Number(match[1]), streetName: words.join(" "), type };
}

function splitLocationNames(address) {
  return String(address)
    .split(/\s*(?:&|\bat\b|\band\b|\/)\s*/i)
    .map((value) => value.trim())
    .filter(Boolean);
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

function geometryPoints(feature) {
  return (feature?.geometry?.paths ?? [])
    .flatMap((path) => path)
    .filter((point) => Array.isArray(point) && point.length >= 2)
    .map((point) => [Number(point[0]), Number(point[1])])
    .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
}

async function findAddress(address) {
  const parsed = parseExactAddress(address);
  if (!parsed) return null;
  const features = await query(
    ADDRESS_LAYER,
    `Number=${parsed.number} AND UPPER(StreetName)=UPPER('${quote(parsed.streetName)}') AND Status <> 'Inactive'`,
    "Number,NumberSuffix,StreetName,PostType,FullStName,Address,Status,LocationType",
  );
  const feature = features.find((item) => geometryPoint(item));
  if (!feature) return null;
  return {
    ...geometryPoint(feature),
    matchedAddress: feature.attributes?.Address ?? address,
    method: "official-address-point",
    exact: true,
  };
}

async function findFacility(name) {
  const features = await query(FACILITY_LAYER, `UPPER(Name) LIKE UPPER('%${quote(name)}%')`, "Name,Type");
  const feature = features.find((item) => geometryPoint(item));
  if (!feature) return null;
  return {
    ...geometryPoint(feature),
    matchedAddress: feature.attributes?.Name ?? name,
    method: "official-facility-point",
    exact: true,
  };
}

async function findStreetFeatures(name) {
  const normalized = normalize(name);
  if (!normalized) return [];
  return query(STREET_LAYER, `UPPER(NAME) LIKE UPPER('%${quote(normalized)}%')`, "NAME,OBJECTID");
}

async function findStreet(name) {
  const features = await findStreetFeatures(name);
  const points = features.flatMap(geometryPoints);
  if (!points.length) return null;
  const lon = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const lat = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  return Number.isFinite(lat) && Number.isFinite(lon)
    ? { lat, lon, matchedAddress: name, method: "official-street-centerline", exact: false }
    : null;
}

async function findIntersection(names) {
  if (names.length < 2) return null;
  const featureGroups = await Promise.all(names.slice(0, 3).map(findStreetFeatures));
  const pointGroups = featureGroups.map((features) => features.flatMap(geometryPoints));
  if (pointGroups.some((points) => points.length === 0)) return null;

  let best = null;
  for (const first of pointGroups[0]) {
    for (const second of pointGroups[1]) {
      const distance = (first[0] - second[0]) ** 2 + (first[1] - second[1]) ** 2;
      if (!best || distance < best.distance) best = { first, second, distance };
    }
  }
  if (!best) return null;

  const lon = (best.first[0] + best.second[0]) / 2;
  const lat = (best.first[1] + best.second[1]) / 2;
  return {
    lat,
    lon,
    matchedAddress: names.slice(0, 2).join(" & "),
    method: "official-intersection-reference",
    exact: false,
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
    let point = await findAddress(project.address);

    if (!point && /pellegrini/i.test(project.name + " " + project.address)) {
      point = await findFacility("Pellegrini");
    }

    const hintedNames = LOCATION_HINTS[project.id] ?? [];
    if (!point && hintedNames.length >= 2) {
      point = await findIntersection(hintedNames);
    }

    const names = splitLocationNames(project.address);
    if (!point && names.length > 1) {
      point = await findIntersection(names);
    }

    if (!point) point = await findStreet(project.address);

    if (!point && /citywide/i.test(project.address)) {
      cityReference ??= await findAddress(CITY_REFERENCE_ADDRESS);
      if (cityReference) {
        point = {
          lat: cityReference.lat,
          lon: cityReference.lon,
          matchedAddress: "Newton citywide reference",
          method: "official-citywide-reference",
          exact: false,
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
  throw new Error(`Official Newton GIS did not resolve ${unresolved.length} catalog projects; refusing to publish incomplete coordinate data.`);
}

const exactLocations = resolved.filter((item) => item.exact).length;
if (exactLocations / projects.length < MIN_EXACT_LOCATION_RATIO) {
  throw new Error(`Only ${exactLocations} of ${projects.length} coordinates are exact official GIS matches; refusing a suspiciously low-quality refresh.`);
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
