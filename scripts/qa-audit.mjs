import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFile(path.join(ROOT, relativePath), "utf8");
const exists = async (relativePath) => {
  try { await fs.access(path.join(ROOT, relativePath)); return true; } catch { return false; }
};

const requiredFiles = [
  "app/layout.tsx", "app/page.tsx", "app/not-found.tsx", "app/robots.ts", "app/sitemap.ts",
  "app/projects/page.tsx", "app/projects/ProjectsClient.tsx", "app/projects/[slug]/page.tsx", "app/map/page.tsx",
  "app/map/MapClient.tsx", "app/api/project-locations/route.ts", "app/components/SiteHeader.tsx", "app/components/ProjectStatusBadge.tsx",
  "data/project-catalog.ts", "data/newton-source.json", "data/project-events.ts", "data/event-collection-status.json",
  "data/project-coordinates.json", "data/coordinate-collection-status.json", "scripts/validate-copy.mjs", "scripts/validate-data-integrity.mjs", "scripts/report-data-health.mjs",
];

for (const file of requiredFiles) if (!(await exists(file))) throw new Error(`Required application file is missing: ${file}`);

const [pkgSource, layout, home, projectsPage, projectsClient, mapClient, locationRoute, catalog, publicProjects, transportationProjects, sourceSource, eventStatusSource, coordinateSource, coordinateStatusSource, notFound, robots, sitemap, header] = await Promise.all([
  read("package.json"), read("app/layout.tsx"), read("app/page.tsx"), read("app/projects/page.tsx"), read("app/projects/ProjectsClient.tsx"),
  read("app/map/MapClient.tsx"), read("app/api/project-locations/route.ts"), read("data/project-catalog.ts"), read("data/public-projects.ts"),
  read("data/transportation-projects.ts"), read("data/newton-source.json"), read("data/event-collection-status.json"), read("data/project-coordinates.json"),
  read("data/coordinate-collection-status.json"), read("app/not-found.tsx"), read("app/robots.ts"), read("app/sitemap.ts"), read("app/components/SiteHeader.tsx"),
]);

const pkg = JSON.parse(pkgSource);
for (const script of ["dev", "build", "start", "lint", "validate:copy", "validate:data", "report:data-health", "qa"]) {
  if (!pkg.scripts?.[script]) throw new Error(`package.json is missing the '${script}' script.`);
}
if (!pkg.dependencies?.next || !pkg.dependencies?.react || !pkg.dependencies?.["react-dom"]) throw new Error("Core Next.js/React dependencies are missing.");

const source = JSON.parse(sourceSource);
const eventStatus = JSON.parse(eventStatusSource);
const coordinates = JSON.parse(coordinateSource);
const coordinateStatus = JSON.parse(coordinateStatusSource);
if (!Array.isArray(source.projects) || source.projects.length === 0) throw new Error("Newton source data contains no projects.");
if (!Array.isArray(eventStatus.sources) || eventStatus.sources.length === 0) throw new Error("Event source health data is empty.");
if (eventStatus.failedSources !== 0 || eventStatus.successfulSources !== eventStatus.sources.length) throw new Error("Event source health is degraded.");
if (!Array.isArray(coordinates.projects) || coordinates.projects.length === 0) throw new Error("GIS coordinate data is empty.");
if (coordinateStatus.unresolvedProjects !== 0 || coordinateStatus.resolvedProjects !== coordinateStatus.totalProjects) throw new Error("GIS coordinate coverage is incomplete.");
if (coordinates.projects.length !== coordinateStatus.resolvedProjects) throw new Error("GIS coordinate output and status disagree.");
if (!String(coordinates.source ?? "").startsWith("https://gisweb.newtonma.gov/")) throw new Error("GIS coordinate provenance is not the official Newton GIS URL.");
if (coordinates.projects.some((project) => project.method === "official-citywide-reference" && project.scope !== "citywide")) throw new Error("A non-citywide project received a citywide GIS reference.");

const extractIds = (text) => [...text.matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]);
const privateIds = source.projects.map((project) => project.id);
const catalogIds = [...privateIds, ...extractIds(publicProjects), ...extractIds(transportationProjects)];
if (new Set(privateIds).size !== privateIds.length) throw new Error("Duplicate project IDs exist in the private source dataset.");
if (new Set(catalogIds).size !== catalogIds.length) throw new Error("Duplicate project IDs exist across the full project catalog.");

const coordinateIds = coordinates.projects.map((project) => project.id);
if (new Set(coordinateIds).size !== coordinateIds.length) throw new Error("Duplicate GIS coordinate records exist.");
const allCatalogIds = new Set(catalogIds);
for (const id of coordinateIds) if (!allCatalogIds.has(id)) throw new Error(`GIS coordinate record ${id} is not in the project catalog.`);
if (coordinateIds.length !== catalogIds.length) throw new Error(`GIS coordinate coverage count ${coordinateIds.length} does not match catalog count ${catalogIds.length}.`);

const allAppText = [layout, home, projectsPage, projectsClient, mapClient, locationRoute, catalog, notFound, robots, sitemap, header].join("\n");
for (const forbidden of ["ProjectGallery", "getProjectImages", "project-media", "/projects/<project-id>"]) {
  if (allAppText.includes(forbidden)) throw new Error(`Removed project-image feature still has an application reference: ${forbidden}`);
}
if (/1000 Commonwealth Avenue/.test(locationRoute)) throw new Error("Runtime project location API still contains the City Hall fallback.");
if (/official-citywide-reference/.test(locationRoute)) throw new Error("Runtime project location API must not invent citywide references; it should serve verified generated locations only.");
if (!locationRoute.includes("project-coordinates.json")) throw new Error("Runtime project location API is not backed by verified generated coordinates.");
if (!notFound.includes("Browse projects")) throw new Error("Production not-found page is incomplete.");
if (!robots.includes("sitemap")) throw new Error("Robots metadata does not advertise the sitemap.");
if (!sitemap.includes("allProjects")) throw new Error("Sitemap does not include project routes.");
if (!header.includes("href=\"/projects\"") || !header.includes("href=\"/map\"")) throw new Error("Primary navigation is missing a core route.");

for (const [label, value] of [["event status checkedAt", eventStatus.checkedAt], ["GIS checkedAt", coordinates.checkedAt], ["GIS status checkedAt", coordinateStatus.checkedAt]]) {
  if (!value || Number.isNaN(new Date(value).getTime())) throw new Error(`${label} is invalid.`);
}

const externalUrls = [...allAppText.matchAll(/https:\/\/[^"'\s)]+/g)].map((match) => match[0]);
for (const url of externalUrls) if (!url.startsWith("https://unpkg.com/leaflet@1.9.4/")) {
  if (!url.startsWith("https://")) throw new Error(`Non-HTTPS external URL found: ${url}`);
}

console.log("PASS 4 QA audit passed.");
console.log(`Required files checked: ${requiredFiles.length}`);
console.log(`Private source projects checked: ${privateIds.length}`);
console.log(`Full catalog project IDs checked: ${catalogIds.length}`);
console.log(`Event sources healthy: ${eventStatus.successfulSources}/${eventStatus.sources.length}`);
console.log(`GIS locations resolved: ${coordinateStatus.resolvedProjects}/${coordinateStatus.totalProjects}`);
console.log("Runtime City Hall GIS fallback: none");
console.log("Project-image feature references: none");
