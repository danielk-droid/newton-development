import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = path.join(ROOT, "data", "project-coordinates.json");
const STATUS_PATH = path.join(ROOT, "data", "coordinate-collection-status.json");
const SOURCE_FILES = [
  path.join(ROOT, "data", "newton-source.json"),
  path.join(ROOT, "data", "public-projects.ts"),
  path.join(ROOT, "data", "transportation-projects.ts"),
];
const GIS = "https://gisweb.newtonma.gov/server/rest/services/Data/MapServer";
const ADDRESS = `${GIS}/12/query`;
const FACILITY = `${GIS}/13/query`;
const STREET = `${GIS}/15/query`;
const PAGE = 2000;
const CITY_REFERENCE = { lat: 42.337381453017024, lon: -71.20861513894442 };
const HINTS = {
  "newton-corner-improvements": ["Washington Street", "Centre Street"],
};
// Some project records use a site/project name instead of the address that is
// indexed in the City's address layer. These are authoritative site addresses
// from City project materials; coordinates are still resolved from official GIS.
const ADDRESS_HINTS = {
  "riverside-mbta-riverside-t-station-355-grove-st-and-399-grove-st-auburndale": ["355 Grove Street", "399 Grove Street"],
  "necp-school-project": ["687 Watertown Street"],
  "oak-hill-school-project": ["130 Wheeler Road"],
  "police-department-facilities-improvements": ["1321 Washington Street", "25 Chestnut Street"],
};
const TYPE = "Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Parkway|Pkwy|Place|Pl|Way|Lane|Ln|Court|Ct|Circle|Cir|Terrace|Ter|Boulevard|Blvd|Highway|Hwy|Roadway|Rte|Route";
const TYPE_ALIAS = new Map(Object.entries({ street: "st", st: "st", road: "rd", rd: "rd", avenue: "ave", ave: "ave", drive: "dr", dr: "dr", parkway: "pkwy", pkwy: "pkwy", place: "pl", pl: "pl", way: "way", lane: "ln", ln: "ln", court: "ct", ct: "ct", circle: "cir", cir: "cir", terrace: "ter", ter: "ter", boulevard: "blvd", blvd: "blvd", highway: "hwy", hwy: "hwy", roadway: "roadway", route: "rte", rte: "rte" }));

function norm(value) {
  return String(value ?? "").toLowerCase().replace(/[.,'’]/g, " ").replace(/\s+/g, " ").trim();
}
function streetKey(value) {
  const tokens = norm(value).split(" ").filter(Boolean);
  if (tokens.length && TYPE_ALIAS.has(tokens.at(-1))) tokens[tokens.length - 1] = TYPE_ALIAS.get(tokens.at(-1));
  return tokens.join(" ");
}
function parseProjects(text) {
  const out = [];
  const re = /\{[\s\S]*?\bid:\s*"([^"]+)"[\s\S]*?\bname:\s*"([^"]+)"[\s\S]*?\baddress:\s*"([^"]+)"[\s\S]*?\}/g;
  for (const m of text.matchAll(re)) out.push({ id: m[1], name: m[2], address: m[3] });
  return out;
}
async function readProjects() {
  const groups = [];
  for (const file of SOURCE_FILES) {
    const text = await fs.readFile(file, "utf8");
    groups.push(file.endsWith("newton-source.json") ? (JSON.parse(text).projects ?? []) : parseProjects(text));
  }
  const map = new Map();
  for (const project of groups.flat()) if (project?.id && project?.name && project?.address) map.set(project.id, project);
  return [...map.values()];
}
async function query(url, where, offset = 0) {
  const params = new URLSearchParams({ where, outFields: "*", returnGeometry: "true", outSR: "4326", resultRecordCount: String(PAGE), resultOffset: String(offset), f: "json" });
  const response = await fetch(`${url}?${params}`, { headers: { "User-Agent": "Newton Development GIS updater" } });
  if (!response.ok) throw new Error(`Newton GIS HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message ?? "Newton GIS query failed");
  return data;
}
async function queryAll(url) {
  const all = [];
  let offset = 0;
  while (true) {
    const data = await query(url, "1=1", offset);
    const features = data.features ?? [];
    all.push(...features);
    if (!data.exceededTransferLimit || !features.length) break;
    offset += features.length;
  }
  return all;
}
function point(feature) {
  const x = Number(feature?.geometry?.x);
  const y = Number(feature?.geometry?.y);
  return Number.isFinite(x) && Number.isFinite(y) ? { lat: y, lon: x } : null;
}
function paths(feature) {
  return (feature?.geometry?.paths ?? []).map(path => path.map(pair => [Number(pair[0]), Number(pair[1])]).filter(pair => Number.isFinite(pair[0]) && Number.isFinite(pair[1]))).filter(path => path.length >= 2);
}
function attrsText(feature) {
  return Object.values(feature?.attributes ?? {}).filter(value => value !== null && value !== undefined).join(" | ");
}
function addressCandidates(address) {
  const result = [];
  const re = new RegExp(`\\b(\\d{1,5})(?:-\\d{1,5})?\\s+([A-Za-z][A-Za-z0-9.'’\\-]*(?:\\s+[A-Za-z][A-Za-z0-9.'’\\-]*){0,5})\\s+(${TYPE})\\b`, "gi");
  for (const match of String(address).matchAll(re)) result.push({ number: Number(match[1]), street: `${match[2]} ${match[3]}` });
  return result.filter((item, index, all) => all.findIndex(other => `${other.number}|${streetKey(other.street)}` === `${item.number}|${streetKey(item.street)}`) === index);
}
function streetCandidates(text) {
  const result = [];
  const re = new RegExp(`\\b([A-Za-z][A-Za-z0-9.'’\\-]*(?:\\s+[A-Za-z][A-Za-z0-9.'’\\-]*){0,5})\\s+(${TYPE})\\b`, "gi");
  for (const match of String(text).matchAll(re)) result.push(`${match[1]} ${match[2]}`);
  return result.filter((item, index, all) => all.findIndex(other => streetKey(other) === streetKey(item)) === index);
}
function addressMatch(features, addresses) {
  const candidates = addresses.flatMap(addressCandidates);
  for (const candidate of candidates) {
    const number = String(candidate.number);
    const streetTokens = norm(candidate.street).split(" ").filter(token => !TYPE_ALIAS.has(token));
    let best = null;
    let bestScore = 0;
    for (const feature of features) {
      const p = point(feature);
      if (!p) continue;
      const text = norm(attrsText(feature));
      if (!new RegExp(`\\b${number}(?:\\.0+)?\\b`).test(text)) continue;
      const matches = streetTokens.filter(token => text.includes(token)).length;
      // Newton's address layer stores address number and street name in separate
      // fields, and the street type is not always present in the same field.
      if (matches >= 1 && matches > bestScore) {
        best = { ...p, matchedAddress: `${candidate.number} ${candidate.street}`, method: "official-address-point", exact: true };
        bestScore = matches;
      }
      if (matches === streetTokens.length && matches > 0) break;
    }
    if (best) return best;
  }
  return null;
}
function midpoint(features) {
  const pairs = features.flatMap(paths).flat();
  if (!pairs.length) return null;
  return { lat: pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length, lon: pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length };
}
function segIntersection(a, b, c, d) {
  const den = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]);
  if (Math.abs(den) < 1e-12) return null;
  const ab = a[0] * b[1] - a[1] * b[0];
  const cd = c[0] * d[1] - c[1] * d[0];
  const x = (ab * (c[0] - d[0]) - (a[0] - b[0]) * cd) / den;
  const y = (ab * (c[1] - d[1]) - (a[1] - b[1]) * cd) / den;
  const between = (value, first, second) => value >= Math.min(first, second) - 1e-9 && value <= Math.max(first, second) + 1e-9;
  return between(x, a[0], b[0]) && between(y, a[1], b[1]) && between(x, c[0], d[0]) && between(y, c[1], d[1]) ? [x, y] : null;
}
function intersection(index, names) {
  if (names.length < 2) return null;
  const first = index.get(streetKey(names[0])) ?? [];
  const second = index.get(streetKey(names[1])) ?? [];
  for (const a of first) for (const pa of paths(a)) for (let i = 1; i < pa.length; i++) for (const b of second) for (const pb of paths(b)) for (let j = 1; j < pb.length; j++) {
    const hit = segIntersection(pa[i - 1], pa[i], pb[j - 1], pb[j]);
    if (hit) return { lat: hit[1], lon: hit[0], matchedAddress: names.slice(0, 2).join(" & "), method: "official-intersection-reference", exact: true };
  }
  return null;
}
function facilityMatch(features, project) {
  const aliases = {
    "police-department-facilities-improvements": ["police", "headquarters", "annex"],
    "necp-school-project": ["necp", "early childhood", "watertown"],
    "oak-hill-school-project": ["oak hill", "wheeler"],
    "riverside-mbta-riverside-t-station-355-grove-st-and-399-grove-st-auburndale": ["riverside", "mbta", "grove"],
  };
  const tokens = [...new Set([...(aliases[project.id] ?? []), ...norm(project.name).split(" ").filter(token => token.length > 3 && !/project|improvement|renovation|facility|school|newton|development|construction|redevelopment/i.test(token))])];
  let best = null;
  for (const feature of features) {
    const p = point(feature);
    if (!p) continue;
    const text = norm(attrsText(feature));
    const score = tokens.reduce((sum, token) => sum + (text.includes(norm(token)) ? 1 : 0), 0);
    if (score >= Math.max(1, Math.ceil(tokens.length * 0.25)) && (!best || score > best.score)) best = { ...p, score, text };
  }
  return best ? { lat: best.lat, lon: best.lon, matchedAddress: best.text.slice(0, 160), method: "official-facility-reference", exact: false } : null;
}
function isCitywide(project) {
  return /^citywide$/i.test(project.address);
}
async function main() {
  const projects = await readProjects();
  const [addresses, facilities, streets] = await Promise.all([queryAll(ADDRESS), queryAll(FACILITY), queryAll(STREET)]);
  console.log(`Loaded ${addresses.length} address points, ${facilities.length} facilities, ${streets.length} street features from official Newton GIS.`);
  const streetIndex = new Map();
  for (const feature of streets) {
    const key = streetKey(feature.attributes?.NAME);
    if (!key) continue;
    if (!streetIndex.has(key)) streetIndex.set(key, []);
    streetIndex.get(key).push(feature);
  }
  const results = [];
  const unresolved = [];
  for (const project of projects) {
    let location = null;
    if (HINTS[project.id]) location = intersection(streetIndex, HINTS[project.id]);
    const addressesToTry = [project.address, ...(ADDRESS_HINTS[project.id] ?? [])];
    if (!location) location = addressMatch(addresses, addressesToTry);
    const names = streetCandidates(addressesToTry.join("; "));
    if (!location && names.length >= 2) location = intersection(streetIndex, names);
    if (!location && names.length === 1) {
      const p = midpoint(streetIndex.get(streetKey(names[0])) ?? []);
      if (p) location = { ...p, matchedAddress: names[0], method: "official-street-centerline-reference", exact: false };
    }
    if (!location) location = facilityMatch(facilities, project);
    if (!location && isCitywide(project)) location = { ...CITY_REFERENCE, matchedAddress: "Newton citywide reference", method: "official-citywide-reference", exact: false, scope: "citywide" };
    if (!location) unresolved.push(project);
    else results.push({ id: project.id, lat: location.lat, lon: location.lon, matchedAddress: location.matchedAddress, method: location.method, exact: location.exact, scope: location.scope ?? "project" });
  }
  if (unresolved.length) throw new Error(`Official Newton GIS did not resolve ${unresolved.length} catalog projects: ${unresolved.map(project => project.id).join(", ")}`);
  const exactLocations = results.filter(result => result.exact).length;
  const referenceLocations = results.length - exactLocations;
  const payload = { checkedAt: new Date().toISOString(), source: "City of Newton GIS Data MapServer", sourceUrl: GIS, projects: results };
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  await fs.writeFile(STATUS_PATH, `${JSON.stringify({ checkedAt: payload.checkedAt, source: payload.source, sourceUrl: payload.sourceUrl, successful: true, totalProjects: projects.length, resolvedProjects: results.length, unresolvedProjects: 0, exactLocations, referenceLocations, methods: Object.fromEntries(results.reduce((map, result) => map.set(result.method, (map.get(result.method) ?? 0) + 1), new Map())) }, null, 2)}\n`);
  console.log(`Resolved ${results.length}/${projects.length} projects.`);
  console.log(`Exact locations: ${exactLocations}. Reference locations: ${referenceLocations}.`);
}
main().catch(async error => {
  console.error(error);
  await fs.writeFile(STATUS_PATH, `${JSON.stringify({ checkedAt: new Date().toISOString(), source: "City of Newton GIS Data MapServer", sourceUrl: GIS, successful: false, error: error.message }, null, 2)}\n`).catch(() => {});
  process.exitCode = 1;
});
