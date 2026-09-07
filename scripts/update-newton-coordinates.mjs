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

const STREET_TYPES = {
  st: "street",
  street: "street",
  rd: "road",
  road: "road",
  ave: "avenue",
  avenue: "avenue",
  av: "avenue",
  dr: "drive",
  drive: "drive",
  pkwy: "parkway",
  parkway: "parkway",
  pl: "place",
  place: "place",
  ln: "lane",
  lane: "lane",
  ct: "court",
  court: "court",
  cir: "circle",
  circle: "circle",
  ter: "terrace",
  terrace: "terrace",
  blvd: "boulevard",
  boulevard: "boulevard",
  way: "way",
  hwy: "highway",
  highway: "highway",
};

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function streetBase(value) {
  const normalized = normalize(value);
  const words = normalized.split(" ").filter(Boolean);
  const typeIndex = words.findIndex((word) => STREET_TYPES[word]);
  return (typeIndex >= 0 ? words.slice(0, typeIndex) : words).join(" ");
}

function parseProjects(source) {
  const lines = source.split(/\r?\n/);
  const projects = [];
  for (let i = 0; i < lines.length; i += 1) {
    const idMatch = lines[i].match(/^\s*id:\s*"([^"]+)"/);
    if (!idMatch) continue;

    let name = null;
    let address = null;
    for (let j = i + 1; j < Math.min(i + 16, lines.length); j += 1) {
      if (/^\s*id:\s*"/.test(lines[j])) break;
      name ??= lines[j].match(/^\s*name:\s*"([^"]+)"/)?.[1] ?? null;
      address ??= lines[j].match(/^\s*address:\s*"([^"]+)"/)?.[1] ?? null;
      if (name && address) break;
    }

    if (name && address) projects.push({ id: idMatch[1], name, address });
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
  const value = String(address);
  const match = value.match(/\b(\d{1,5}(?:-\d{1,5})?)\s+([A-Za-z][A-Za-z' -]*?\b(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Parkway|Pkwy|Place|Pl|Way|Lane|Ln|Court|Ct|Circle|Cir|Terrace|Ter|Boulevard|Blvd|Highway|Hwy)\b)/i);
  if (!match) return null;
  return { number: match[1].split("-")[0], street: match[2].trim() };
}

function parseStreetOnly(address) {
  const match = String(address).match(/^\s*([^,]+?)(?:\s+street|\s+st|\s+road|\s+rd|\s+avenue|\s+ave|\s+drive|\s+dr|\s+parkway|\s+pkwy|\s+place|\s+pl|\s+way|\s+lane|\s+ln|\s+court|\s+ct|\s+circle|\s+cir|\s+terrace|\s+ter|\s+boulevard|\s+blvd|\s+highway|\s+hwy)\b/i);
  return match ? match[0].trim() : null;
}

async function query(url, params) {
  const target = `${url}?${new URLSearchParams({ ...params, f: "json" })}`;
  const response = await fetch(target, {
    headers: { "User-Agent": "Newton Development official GIS updater" },
  });
  if (!response.ok) throw new Error(`GIS HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`GIS query failed: ${data.error.message}`);
  return data;
}

async function findAddress(project) {
  const parsed = parseAddress(project.address);
  if (!parsed) return null;

  const base = streetBase(parsed.street);
  if (!base) return null;

  const data = await query(ADDRESS_LAYER, {
    where: `Number=${Number(parsed.number)} AND UPPER(FullStName) LIKE UPPER('%${base.replace(/'/g, "''")}%') AND Status <> 'Inactive'`,
    outFields: "Number,NumberSuffix,FullStName,Address,Status,LocationType",
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "20",
  });

  const feature = (data.features ?? []).find(
    (item) => item.geometry?.x != null && item.geometry?.y != null,
  );
  if (!feature) return null;

  return {
    lat: Number(feature.geometry.y),
    lon: Number(feature.geometry.x),
    matchedAddress: feature.attributes?.Address ?? project.address,
    method: "official-address-point",
  };
}

async function findStreet(project) {
  const street = parseStreetOnly(project.address);
  if (!street) return null;

  const base = streetBase(street);
  if (!base) return null;

  const data = await query(STREET_LAYER, {
    where: `UPPER(NAME) LIKE UPPER('%${base.replace(/'/g, "''")}%')`,
    outFields: "NAME,OBJECTID",
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "200",
  });

  const points = (data.features ?? []).flatMap((feature) =>
    (feature.geometry?.paths ?? []).flat(),
  );
  if (!points.length) return null;

  const lat = points.reduce((sum, point) => sum + Number(point[1]), 0) / points.length;
  const lon = points.reduce((sum, point) => sum + Number(point[0]), 0) / points.length;

  return {
    lat,
    lon,
    matchedAddress: street,
    method: "official-street-centerline",
  };
}

const source = JSON.parse(await fs.readFile(SOURCE_PATH, "utf8"));
const publicSource = await fs.readFile(PUBLIC_PATH, "utf8");
const transportSource = await fs.readFile(TRANSPORT_PATH, "utf8");
const projects = mergeProjects(
  source.projects ?? [],
  parseProjects(publicSource),
  parseProjects(transportSource),
);

const resolved = [];
const unresolved = [];

for (const project of projects) {
  if (/^citywide$/i.test(project.address.trim())) {
    unresolved.push({ id: project.id, address: project.address, reason: "citywide" });
    continue;
  }

  try {
    const point = (await findAddress(project)) ?? (await findStreet(project));
    if (point && Number.isFinite(point.lat) && Number.isFinite(point.lon)) {
      resolved.push({ id: project.id, ...point });
    } else {
      unresolved.push({ id: project.id, address: project.address, reason: "no official GIS match" });
    }
  } catch (error) {
    unresolved.push({ id: project.id, address: project.address, reason: error.message });
  }
}

if (resolved.length === 0) {
  throw new Error("Official Newton GIS returned no project coordinates; refusing to publish coordinate data.");
}

await fs.writeFile(
  OUTPUT_PATH,
  `${JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      source: `${GIS_BASE}/12 and ${GIS_BASE}/15`,
      sourceDescription: "City of Newton GIS address points and street centerlines",
      projects: resolved,
      unresolved,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Resolved ${resolved.length} of ${projects.length} catalog projects from official Newton GIS.`);
console.log(`Unresolved: ${unresolved.length}.`);
