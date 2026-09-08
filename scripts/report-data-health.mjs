import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (file) => JSON.parse(await fs.readFile(path.join(ROOT, "data", file), "utf8"));
const source = await readJson("newton-source.json");
const events = await readJson("event-collection-status.json");
const coordinates = await readJson("project-coordinates.json");
const coordinateStatus = await readJson("coordinate-collection-status.json");

const checkedAt = [source.fetchedAt, events.checkedAt, coordinates.checkedAt, coordinateStatus.checkedAt];
for (const value of checkedAt) if (!value || Number.isNaN(new Date(value).getTime())) throw new Error("Generated data is missing a valid collection timestamp.");
if (events.failedSources !== 0 || events.successfulSources !== events.sources?.length) throw new Error("Official event-source monitoring is degraded.");
if (coordinateStatus.unresolvedProjects !== 0) throw new Error("Official GIS coordinate monitoring found unresolved projects.");
if (coordinateStatus.resolvedProjects !== coordinateStatus.totalProjects) throw new Error("GIS coordinate coverage is incomplete.");
if (coordinates.projects?.length !== coordinateStatus.resolvedProjects) throw new Error("GIS coordinate output and monitor status disagree.");

const lines = [
  "## Newton Development data refresh",
  "",
  `- Projects: ${source.projectCount} (fetched ${source.fetchedAt})`,
  `- Official event sources: ${events.successfulSources}/${events.sources.length} healthy (checked ${events.checkedAt})`,
  `- GIS coordinates: ${coordinateStatus.resolvedProjects}/${coordinateStatus.totalProjects} resolved; ${coordinateStatus.exactLocations} exact, ${coordinateStatus.referenceLocations} reference (checked ${coordinates.checkedAt})`,
];
console.log(lines.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
