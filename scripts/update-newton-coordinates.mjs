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

const STREET_TYPES = "Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Parkway|Pkwy|Place|Pl|Way|Lane|Ln|Court|Ct|Circle|Cir|Terrace|Ter|Boulevard|Blvd|Highway|Hwy|Roadway|Rte|Route";
const STREET_TYPE_ALIASES = {
  street: "st", st: "st", road: "rd", rd: "rd", avenue: "ave", ave: "ave", drive: "dr", dr: "dr",
  parkway: "pkwy", pkwy: "pkwy", place: "pl", pl: "pl", way: "way", lane: "ln", ln: "ln",
  court: "ct", ct: "ct", circle: "cir", cir: "cir", terrace: "ter", ter: "ter", boulevard: "blvd",
  blvd: "blvd", highway: "hwy", hwy: "hwy", roadway: "roadway", route: "rte", rte: "rte",
};

const LOCATION_HINTS = {
  "newton-corner-improvements": ["Washington Street", "Centre Street"],
};

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[.,'’]/g, " ").replace(/\s+/g, " ").trim();
}

function canonicalStreet(value) {
  const tokens = normalize(value).split(" ").filter(Boolean);
  if (!tokens.length) return "";
  const last = tokens[tokens.length - 1];
  if (STREET_TYPE_ALIASES[last]) tokens[tokens.length - 1] = STREET_TYPE_ALIASES[last];
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
  const pattern = new RegExp(`\\b(\\d{1,5})(?:-\\d{1,5})?\\s+([A-Za-z0-9.'’-]+(?:\\s+[A-Za-z0-9.'’-]+){0,5}?)\\s+(${STREET_TYPES})\\b`, "gi");
  const result = [];
  for (const match of String(address).matchAll(pattern)) {
    const street = `${match[2].trim()} ${match[3]}`;
    const key = `${Number(match[1])}|${canonicalStreet(street)}`;
    if (!result.some((item) => item.key === key)) result.push({ number: Number(match[1]), street, key });
  }
  return result;
}

function extractStreetName(value) {
  const match = String(value).match(new RegExp(`\\b([A-Za-z0-9.'’-]+(?:\\s+[A-Za-z0-9.'’-]+){0,5})\\s+(${STREET_TYPES})\\b`, "i"));
  return match ? `${match[1].trim()} ${match[2]}` : null;
}

function extractStreetCandidates(address) {
  const result = [];
  const add = (value) => {
    const street = extractStreetName(value);
    if (street && !result.some((item) => canonicalStreet(item) === canonicalStreet(street))) result.push(street);
  };
  for (const part of String(address).split(/\s*(?:&|\bat\b|\band\b|\/)\s*/i)) add(part);
  for (const match of String(address).matchAll(new RegExp(`\\b[A-Za-z0-9.'’-]+(?:\\s+[A-Za-z0-9.'’-]+){0,5}\\s+(?:${STREET_TYPES})\\b`, "gi"))) add(match[0]);
  return result;
}

async function query(url, where, outFields) {
  const params = new URLSearchParams({ where, outFields, returnGeometry: "true", outSR: "4326", resultRecordCount: "200", f: "json" });
  const response = await fetch(`${url}?${params}`, { headers: { "User-Agent": "Newton Development GIS updater" } });
  if (!response.ok) throw new Error(`Official Newton GIS HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message ?? "Official Newton GIS query failed");
  return data.features ?? [];
}

function point(feature) {
  const lon = Number(feature?.geometry?.x);
  const lat = Number(feature?.geometry?.y);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

function paths(feature) {
  return (feature?.geometry?.paths ?? []).map((path) => path.map((p) => [Number(p[0]), Number(p[1])]).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))).filter((path) => path.length > 1);
}

function segmentIntersection(a, b, c, d) {
  const denominator = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]);
  if (Math.abs(denominator) < 1e-12) return null;
  const ab = a[0] * b[1] - a[1] * b[0];
  const cd = c[0] * d[1] - c[1] * d[0];
  const x = (ab * (c[0] - d[0]) - (a[0] - b[0]) * cd) / denominator;
  const y = (ab * (c[1] - d[1]) - (a[1] - b[1]) * cd) / denominator;
  const inside = (v, x1, x2) => v >= Math.min(x1, x2) - 1e-9 && v <= Math.max(x1, x2) + 1e-9;
  return inside(x, a[0], b[0]) && inside(y, a[1], b[1]) && inside(x, c[0], d[0]) && inside(y, c[1], d[1]) ? [x, y] : null;
}

async function findAddress(address) {
  const candidates = extractAddressCandidates(address);
  const matches = [];
  for (const candidate of candidates) {
    const streetName = candidate.street.replace(new RegExp(`\\s+(${STREET_TYPES})$`, "i"), "");
    const features = await query(ADDRESS_LAYER, `Number=${candidate.number} AND UPPER(StreetName) LIKE UPPER('%${quote(streetName)}%')`, "Number,StreetName,FullStName,Address,Status");
    const match = features.find((feature) => feature.attributes?.Status !== "Inactive" && point(feature));
    if (match) matches.push({ point: point(match), address: match.attributes?.Address ?? candidate.street });
  }
  return matches;
}

async function findStreetFeatures(name) {
  const street = extractStreetName(name) ?? name;
  const canonical = canonicalStreet(street);
  const base = canonical.replace(/\s+(st|rd|ave|dr|pkwy|pl|way|ln|ct|cir|ter|blvd|hwy|roadway|rte)$/, "");
  if (!base) return [];
  const features = await query(STREET_LAYER, `UPPER(NAME) LIKE UPPER('%${quote(base)}%')`, "NAME,OBJECTID");
  return features.filter((feature) => canonicalStreet(feature.attributes?.NAME) === canonical);
}

async function findIntersection(names) {
  if (names.length < 2) return null;
  const groups = await Promise.all(names.slice(0, 2).map(findStreetFeatures));
  if (groups.some((group) => group.length === 0)) return null;
  let best = null;
  for (const first of groups[0]) for (const firstPath of paths(first)) for (let i = 1; i < firstPath.length; i += 1) {
    for (const second of groups[1]) for (const secondPath of paths(second)) for (let j = 1; j < secondPath.length; j += 1) {
      const hit = segmentIntersection(firstPath[i - 1], firstPath[i], secondPath[j - 1], secondPath[j]);
      if (hit) return { lat: hit[1], lon: hit[0], matchedAddress: names.slice(0, 2).join(" & "), method: "official-intersection-reference", exact: true };
      const candidates = [firstPath[i - 1], firstPath[i], secondPath[j - 1], secondPath[j]];
      for (const candidate of candidates) {
        const distance = Math.min(...candidates.filter((p) => p !== candidate).map((p) => (candidate[0] - p[0]) ** 2 + (candidate[1] - p[1]) ** 2));
        if (!best || distance < best.distance) best = { candidate, distance };
      }
    }
  }
  if (!best || best.distance > 0.0005 ** 2) return null;
  return { lat: best.candidate[1], lon: best.candidate[0], matchedAddress: names.slice(0, 2).join(" & "), method: "official-intersection-reference", exact: false };
}

async function findStreetReference(name) {
  const features = await findStreetFeatures(name);
  const allPoints = features.flatMap(paths).flat();
  if (!allPoints.length) return null;
  return {
    lat: allPoints.reduce((sum, p) => sum + p[1], 0) / allPoints.length,
    lon: allPoints.reduce((sum, p) => sum + p[0], 0) / allPoints.length,
    matchedAddress: extractStreetName(name) ?? name,
    method: "official-street-centerline-reference",
    exact: false,
  };
}

async function findFacility(name) {
  const tokens = normalize(name).split(" ").filter((token) => token.length >= 4 && !["project", "improvement", "improvements", "renovation", "facility", "facilities", "newton"].includes(token));
  if (!tokens.length) return null;
  const features = await query(FACILITY_LAYER, "1=1", "Name,Type");
  const ranked = features.map((feature) => {
    const text = normalize(`${feature.attributes?.Name ?? ""} ${feature.attributes?.Type ?? ""}`);
    return { feature, score: tokens.filter((token) => text.includes(token)).length };
  }).filter((item) => item.score > 0 && point(item.feature)).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || (tokens.length > 1 && best.score < Math.ceil(tokens.length / 3))) return null;
  if (ranked[1]?.score === best.score && best.score === 1) return null;
  return { ...point(best.feature), matchedAddress: best.feature.attributes?.Name ?? name, method: "official-facility-point", exact: true };
}

const source = JSON.parse(await fs.readFile(SOURCE_PATH, "utf8"));
const publicSource = await fs.readFile(PUBLIC_PATH, "utf8");
const transportSource = await fs.readFile(TRANSPORT_PATH, "utf8");
const projects = mergeProjects(source.projects ?? [], parseProjects(publicSource), parseProjects(transportSource));
if (!projects.length) throw new Error("Newton project catalog is empty; refusing to generate GIS coordinates.");

for (const [name, url] of [["address", ADDRESS_LAYER], ["facility", FACILITY_LAYER], ["street", STREET_LAYER]]) {
  await query(url, "1=1", "OBJECTID");
  console.log(`Official Newton GIS ${name} layer is available.`);
}

const resolved = [];
const unresolved = [];
for (const project of projects) {
  let location = null;
  const addresses = await findAddress(project.address);
  if (addresses.length === 1) {
    location = { ...addresses[0].point, matchedAddress: addresses[0].address, method: "official-address-point", exact: true };
  } else if (addresses.length > 1) {
    location = {
      lat: addresses.reduce((sum, item) => sum + item.point.lat, 0) / addresses.length,
      lon: addresses.reduce((sum, item) => sum + item.point.lon, 0) / addresses.length,
      matchedAddress: addresses.map((item) => item.address).join("; "),
      method: "official-multi-address-reference",
      exact: false,
    };
  }

  if (!location) {
    const hints = LOCATION_HINTS[project.id] ?? [];
    if (hints.length >= 2) location = await findIntersection(hints);
  }

  const streets = extractStreetCandidates(project.address);
  if (!location && streets.length >= 2) location = await findIntersection(streets);
  if (!location && streets.length === 1) location = await findStreetReference(streets[0]);
  if (!location) location = await findFacility(project.name);

  if (!location && /^citywide$/i.test(project.address.trim())) {
    const reference = await findAddress(CITY_REFERENCE_ADDRESS);
    if (reference[0]) location = { ...reference[0].point, matchedAddress: "Newton citywide reference", method: "official-citywide-reference", exact: false, scope: "citywide" };
  }

  if (location && Number.isFinite(location.lat) && Number.isFinite(location.lon)) resolved.push({ id: project.id, ...location });
  else unresolved.push({ id: project.id, address: project.address, reason: "No official Newton GIS match" });
}

if (unresolved.length) throw new Error(`Official Newton GIS did not resolve ${unresolved.length} catalog projects: ${unresolved.map((item) => item.id).join(", ")}`);
const exactLocations = resolved.filter((item) => item.exact).length;
if (exactLocations / projects.length < MIN_EXACT_LOCATION_RATIO) throw new Error(`Only ${exactLocations} of ${projects.length} coordinates are exact official GIS matches.`);
const badFallbacks = resolved.filter((item) => item.method === "official-citywide-reference" && item.scope !== "citywide");
if (badFallbacks.length) throw new Error(`Non-citywide projects were assigned the citywide reference: ${badFallbacks.map((item) => item.id).join(", ")}`);

const checkedAt = new Date().toISOString();
await fs.writeFile(OUTPUT_PATH, `${JSON.stringify({ checkedAt, source: `${GIS_BASE}/12, ${GIS_BASE}/13, and ${GIS_BASE}/15`, sourceDescription: "City of Newton GIS address points, city facilities, and street centerlines", projects: resolved, unresolved }, null, 2)}\n`, "utf8");
await fs.writeFile(STATUS_PATH, `${JSON.stringify({ checkedAt, source: `${GIS_BASE}/12, ${GIS_BASE}/13, and ${GIS_BASE}/15`, totalProjects: projects.length, resolvedProjects: resolved.length, unresolvedProjects: unresolved.length, exactLocations, referenceLocations: resolved.filter((item) => !item.exact).length, failures: unresolved }, null, 2)}\n`, "utf8");

console.log(`Resolved ${resolved.length} of ${projects.length} catalog projects from official Newton GIS.`);
console.log(`Exact locations: ${exactLocations}.`);
console.log(`Reference locations: ${resolved.filter((item) => !item.exact).length}.`);
console.log(`Unresolved: ${unresolved.length}.`);