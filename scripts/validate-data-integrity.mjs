import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "data", "newton-source.json");
const publicProjectsPath = path.join(ROOT, "data", "public-projects.ts");
const transportationPath = path.join(ROOT, "data", "transportation-projects.ts");
const highlightsPath = path.join(ROOT, "data", "project-highlights.ts");
const eventsPath = path.join(ROOT, "data", "project-events.ts");
const statusPath = path.join(ROOT, "data", "event-collection-status.json");

const data = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const publicProjectsSource = await fs.readFile(publicProjectsPath, "utf8");
const transportationSource = await fs.readFile(transportationPath, "utf8");
const highlightsSource = await fs.readFile(highlightsPath, "utf8");
const eventsSource = await fs.readFile(eventsPath, "utf8");
const status = JSON.parse(await fs.readFile(statusPath, "utf8"));

const allowedEventHosts = new Set(["www.newtonma.gov", "apps.newtonma.gov"]);
const allowedCatalogHosts = new Set([
  "www.newtonma.gov",
  "newtonma.gov",
  "apps.newtonma.gov",
  "newtonma.viewpointcloud.com",
  "newtonma.portal.opengov.com",
  "www.newton.k12.ma.us",
  "newton.k12.ma.us",
]);

if (!Array.isArray(data.projects) || data.projects.length === 0) {
  throw new Error("Private development project data is empty.");
}

function extractProjectIds(source) {
  return [...source.matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]);
}

const projectIds = new Set([
  ...data.projects.map((project) => project.id),
  ...extractProjectIds(publicProjectsSource),
  ...extractProjectIds(transportationSource),
]);

const urlFields = [];
for (const project of data.projects) {
  if (project.sourceUrl) urlFields.push([`project ${project.id} sourceUrl`, project.sourceUrl]);
  for (const link of project.links ?? []) urlFields.push([`project ${project.id} link`, link.url]);
}

for (const source of [publicProjectsSource, transportationSource]) {
  for (const match of source.matchAll(/\b(?:sourceUrl|url):\s*"(https:\/\/[^"\n]+)"/g)) {
    urlFields.push(["catalog source URL", match[1]]);
  }
}

for (const match of highlightsSource.matchAll(/\{\s*label:\s*"([^"]+)"\s*,\s*value:\s*"([^"]+)"\s*,\s*sourceUrl:\s*"(https:\/\/[^"\n]+)"\s*\}/g)) {
  urlFields.push([`project highlight ${match[1]}`, match[3]]);
}

for (const [label, value] of urlFields) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`${label} is not a valid URL: ${value}`); }
  if (parsed.protocol !== "https:") throw new Error(`${label} must use HTTPS: ${value}`);
  if (!allowedCatalogHosts.has(parsed.hostname.toLowerCase())) {
    throw new Error(`${label} points outside approved authoritative hosts: ${value}`);
  }
}

const highlightProjectIds = [...highlightsSource.matchAll(/^\s*"([^"]+)":\s*\[/gm)].map((match) => match[1]);
for (const projectId of highlightProjectIds) {
  if (!projectIds.has(projectId)) throw new Error(`Project highlights reference unknown project ${projectId}.`);
}

const eventBlocks = [...eventsSource.matchAll(/\{\s*id:\s*"([^"]+)"[\s\S]*?verified:\s*true,\s*\}/g)].map((match) => match[0]);
const seenEventKeys = new Set();
for (const block of eventBlocks) {
  const read = (field) => block.match(new RegExp(`${field}:\\s*"([^"]*)"`))?.[1];
  const projectId = read("projectId");
  const date = read("date");
  const sourceUrl = read("sourceUrl");
  const participationUrl = read("participationUrl");
  const matchedAddress = read("matchedAddress");
  const sourceCheckedAt = read("sourceCheckedAt");
  const id = read("id");
  const type = read("type");

  if (!projectIds.has(projectId)) throw new Error(`Event ${id} references unknown project ${projectId}.`);
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(date ?? "")) throw new Error(`Event ${id} has an invalid date.`);

  const parsedDate = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new Error(`Event ${id} has an invalid calendar date: ${date}.`);
  }

  let parsedUrl;
  try { parsedUrl = new URL(sourceUrl); } catch { throw new Error(`Event ${id} has an invalid source URL.`); }
  if (parsedUrl.protocol !== "https:") throw new Error(`Event ${id} source URL must use HTTPS.`);
  if (!allowedEventHosts.has(parsedUrl.hostname.toLowerCase())) {
    throw new Error(`Event ${id} points outside the approved City source hosts: ${sourceUrl}`);
  }

  if (participationUrl) {
    let participation;
    try { participation = new URL(participationUrl); } catch { throw new Error(`Event ${id} has an invalid participation URL.`); }
    if (participation.protocol !== "https:") throw new Error(`Event ${id} participation URL must use HTTPS.`);
    if (!allowedEventHosts.has(participation.hostname.toLowerCase())) {
      throw new Error(`Event ${id} participation URL points outside the approved City source hosts: ${participationUrl}`);
    }
  }

  if (sourceCheckedAt) {
    const checked = new Date(sourceCheckedAt);
    if (Number.isNaN(checked.getTime())) throw new Error(`Event ${id} has an invalid sourceCheckedAt timestamp.`);
    if (!matchedAddress) throw new Error(`Event ${id} has a source check timestamp but no recorded project-match evidence.`);
  }

  const key = `${projectId}|${date}|${type}|${sourceUrl}`;
  if (seenEventKeys.has(key)) throw new Error(`Duplicate project event record: ${key}`);
  seenEventKeys.add(key);
}

if (!Array.isArray(status.sources) || status.sources.length === 0) {
  throw new Error("No event source health records are present.");
}

if (status.sources.length !== 6) {
  throw new Error(`Expected 6 configured official event sources, found ${status.sources.length}.`);
}

if (!Array.isArray(status.allowedHosts) || status.allowedHosts.some((host) => !allowedEventHosts.has(host))) {
  throw new Error("Event collector allowed-host configuration is not restricted to approved City hosts.");
}

for (const source of status.sources) {
  let parsed;
  try { parsed = new URL(source.url); } catch { throw new Error(`Event source ${source.name} has an invalid URL.`); }
  if (parsed.protocol !== "https:" || !allowedEventHosts.has(parsed.hostname.toLowerCase())) {
    throw new Error(`Event source ${source.name} is outside the approved City source hosts: ${source.url}`);
  }
  if (!source.checkedAt || Number.isNaN(new Date(source.checkedAt).getTime())) {
    throw new Error(`Event source ${source.name} has no valid check timestamp.`);
  }
}

if (status.successfulSources < 1) {
  throw new Error("No official event source completed successfully.");
}

console.log(`Validated ${projectIds.size} catalog projects, ${highlightProjectIds.length} highlighted projects, ${eventBlocks.length} events, and ${urlFields.length} source URLs.`);
console.log(`Approved event hosts: ${[...allowedEventHosts].join(", ")}`);
console.log(`Event source health: ${status.successfulSources} successful, ${status.failedSources} failed.`);
