import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_PATH = path.join(ROOT, "data", "newton-source.json");
const PUBLIC_PATH = path.join(ROOT, "data", "public-projects.ts");
const TRANSPORT_PATH = path.join(ROOT, "data", "transportation-projects.ts");
const OUTPUT_PATH = path.join(ROOT, "data", "project-coordinates.json");
const GIS_BASE = "https://gisweb.newtonma.gov/server/rest/services/Data/MapServer";
const ADDRESS_LAYER = `${GIS_BASE}/12/query`;
const STREET_LAYER = `${GIS_BASE}/15/query`;

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseProjects(source) {
  const projects = [];
  const objectRegex = /\{\s*id:\s*"([^"]+)"[\s\S]*?\n\s*\},/g;
  for (const match of source.matchAll(objectRegex)) {
    const block = match[0];
    const id = match[1];
    const name = block.match(/\n\s*name:\s*"([^"]+)"/)?.[1];
    const address = block.match(/\n\s*address:\s*"([^"]+)"/)?.[1];
    if (id && name && address) projects.push({ id, name, address });
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

function parseAddress(address) {
  const match = String(address).match(/^\s*(\d{1,5}(?:-\d{1,5})?)\s+(.+?)(?:,\s*[^,]+)?$/);
  if (!match) return null;
  const number = match[1].split("-")[0];
  const street = match[2].trim().replace(/\s+(?:newton(?:ville|ville)?|auburndale|waban|newton)$/i, "");
  return { number, street };
}

async function query(url, params) {
  const target = `${url}?${new URLSearchParams({ ...params, f: "json" })}`;
  const response = await fetch(target, { headers: { "User-Agent": "Newton Development official GIS updater" } });
  if (!response.ok) throw new Error(`GIS HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`GIS query failed: ${data.error.message}`);
  return data;
}

async function findAddress(project) {
  const parsed = parseAddress(project.address);
  if (!parsed) return null;
  const street = normalize(parsed.street).replace(/\b(st|rd|ave|av|dr|pkwy|pl|ln|ct|cir|ter|blvd|hwy)\b/g, (type) => ({ st: "street", rd: "road", ave: "avenue", av: "avenue", dr: "drive", pkwy: "parkway", pl: "place", ln: "lane", ct: "court", cir: "circle", ter: "terrace", blvd: "boulevard", hwy: "highway" }[type]));
  const data = await query(ADDRESS_LAYER, {
    where: `Number=${Number(parsed.number)} AND UPPER(FullStName) LIKE UPPER('%${street.replace(/'/g, "''")}%') AND Status <> 'Inactive'`,
    outFields: "Number,NumberSuffix,FullStName,Address,Status,LocationType",
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "20",
  });
  const features = Array.isArray(data.features) ? data.features : [];
  const feature = features.find((item) => item.geometry?.x != null && item.geometry?.y != null);
  if (!feature) return null;
  return {
    lat: Number(feature.geometry.y),
    lon: Number(feature.geometry.x),
    matchedAddress: feature.attributes?.Address ?? project.address,
    method: "official-address-point",
  };
}

async function findStreet(project) {
  const match = String(project.address).match(/^\s*([^,]+?)(?:\s+street|\s+road|\s+avenue|\s+drive|\s+parkway|\s+place|\s+way|\s+lane|\s+court|\s+circle|\s+terrace|\s+boulevard)\b/i);
  if (!match) return null;
  const street = normalize(match[0]);
  const data = await query(STREET_LAYER, {
    where: `UPPER(NAME) = UPPER('${street.replace(/'/g, "''")}')`,
    outFields: "NAME,OBJECTID",
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "200",
  });
  const features = Array.isArray(data.features) ? data.features : [];
  const points = features.flatMap((feature) => (feature.geometry?.paths ?? []).flat());
  if (!points.length) return null;
  const lat = points.reduce((sum, point) => sum + Number(point[1]), 0) / points.length;
  const lon = points.reduce((sum, point) => sum + Number(point[0]), 0) / points.length;
  return { lat, lon, matchedAddress: street, method: "official-street-centerline" };
}

const source = JSON.parse(await fs.readFile(SOURCE_PATH, "utf8"));
const publicSource = await fs.readFile(PUBLIC_PATH, "utf8");
const transportSource = await fs.readFile(TRANSPORT_PATH, "utf8");
const projects = mergeProjects(source.projects ?? [], parseProjects(publicSource), parseProjects(transportSource));

const resolved = [];
const unresolved = [];
for (const project of projects) {
  if (/^citywide$/i.test(project.address.trim())) {
    unresolved.push({ id: project.id, address: project.address, reason: "citywide" });
    continue;
  }
  try {
    const point = await findAddress(project) ?? await findStreet(project);
    if (point && Number.isFinite(point.lat) && Number.isFinite(point.lon)) {
      resolved.push({ id: project.id, ...point });
      continue;
    }
    unresolved.push({ id: project.id, address: project.address, reason: "no official GIS match" });
  } catch (error) {
    unresolved.push({ id: project.id, address: project.address, reason: error.message });
  }
}

if (resolved.length === 0) throw new Error("Official Newton GIS returned no project coordinates; refusing to publish coordinate data.");

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify({
  checkedAt: new Date().toISOString(),
  source: `${GIS_BASE}/12 and ${GIS_BASE}/15`,
  sourceDescription: "City of Newton GIS address points and street centerlines",
  projects: resolved,
  unresolved,
}, null, 2)}\n`, "utf8");

console.log(`Resolved ${resolved.length} of ${projects.length} catalog projects from official Newton GIS.`);
console.log(`Unresolved: ${unresolved.length}.`);
