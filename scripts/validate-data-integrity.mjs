import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "data", "newton-source.json");
const eventsPath = path.join(ROOT, "data", "project-events.ts");
const statusPath = path.join(ROOT, "data", "event-collection-status.json");

const data = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const eventsSource = await fs.readFile(eventsPath, "utf8");
const status = JSON.parse(await fs.readFile(statusPath, "utf8"));

if (!Array.isArray(data.projects) || data.projects.length === 0) {
  throw new Error("Project data is empty.");
}

const projectIds = new Set(data.projects.map((project) => project.id));
const urlFields = [];
for (const project of data.projects) {
  if (project.sourceUrl) urlFields.push([`project ${project.id} sourceUrl`, project.sourceUrl]);
  for (const link of project.links ?? []) urlFields.push([`project ${project.id} link`, link.url]);
}

for (const [label, value] of urlFields) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`${label} is not a valid URL: ${value}`); }
  if (parsed.protocol !== "https:") throw new Error(`${label} must use HTTPS: ${value}`);
}

const eventBlocks = [...eventsSource.matchAll(/\{\s*id:\s*"([^"]+)"[\s\S]*?verified:\s*true,\s*\}/g)].map((match) => match[0]);
const seenEventKeys = new Set();
for (const block of eventBlocks) {
  const read = (field) => block.match(new RegExp(`${field}:\\s*"([^"]*)"`))?.[1];
  const projectId = read("projectId");
  const date = read("date");
  const sourceUrl = read("sourceUrl");
  const id = read("id");

  if (!projectIds.has(projectId)) throw new Error(`Event ${id} references unknown project ${projectId}.`);
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(date ?? "")) throw new Error(`Event ${id} has an invalid date.`);

  const parsedDate = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new Error(`Event ${id} has an invalid calendar date: ${date}.`);
  }

  let parsedUrl;
  try { parsedUrl = new URL(sourceUrl); } catch { throw new Error(`Event ${id} has an invalid source URL.`); }
  if (parsedUrl.protocol !== "https:") throw new Error(`Event ${id} source URL must use HTTPS.`);

  const key = `${projectId}|${date}|${read("type")}`;
  if (seenEventKeys.has(key)) throw new Error(`Duplicate project event key: ${key}`);
  seenEventKeys.add(key);
}

if (!Array.isArray(status.sources) || status.sources.length === 0) {
  throw new Error("No event source health records are present.");
}

if (status.successfulSources < 1) {
  throw new Error("No official event source completed successfully.");
}

console.log(`Validated ${data.projects.length} projects, ${eventBlocks.length} events, and ${urlFields.length} source URLs.`);
console.log(`Event source health: ${status.successfulSources} successful, ${status.failedSources} failed.`);
