import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const BASE_URL = "https://www.newtonma.gov";
const ALLOWED_HOSTS = new Set(["www.newtonma.gov", "apps.newtonma.gov"]);
const PROJECT_DATA_PATH = path.join(ROOT, "data", "newton-source.json");
const PUBLIC_PROJECT_DATA_PATH = path.join(ROOT, "data", "public-projects.ts");
const TRANSPORTATION_PROJECT_DATA_PATH = path.join(ROOT, "data", "transportation-projects.ts");
const EVENTS_PATH = path.join(ROOT, "data", "project-events.ts");
const STATUS_PATH = path.join(ROOT, "data", "event-collection-status.json");

const SOURCES = [
  { name: "Newton Electronic Posting Board", url: `${BASE_URL}/government/city-clerk/city-council/electronic-posting-board`, body: "City records" },
  { name: "Newton Friday Packet Archives", url: `${BASE_URL}/government/city-clerk/city-council/friday-packet/friday-packet-archives`, body: "City records" },
  { name: "Planning and Development Board", url: `${BASE_URL}/government/planning/boards-commissions/planning-and-development-board`, body: "Planning & Development Board" },
  { name: "Urban Design Commission", url: `${BASE_URL}/government/planning/boards-commissions/urban-design-commission`, body: "Urban Design Commission" },
  { name: "Newton Historical Commission", url: `${BASE_URL}/government/planning/divisions/historic-preservation/newton-historical-commission`, body: "Newton Historical Commission" },
  { name: "Historic Preservation and Local HDCs", url: `${BASE_URL}/government/planning/historic-preservation`, body: "Historic District Commission" },
];

const BLOCKED_TITLE_PATTERNS = [
  /finance/i, /public facilities/i, /public safety/i, /transportation/i, /traffic council/i, /programs\s*&\s*services/i,
  /real property/i, /school committee/i, /school department/i, /appropriation/i, /budget/i, /capital improvement/i,
  /capital projects/i, /\bcip\b/i, /committee of the whole/i, /chairs meeting/i, /rules subcommittee/i,
  /economic development commission/i, /community preservation committee/i, /parks\s*&\s*recreation/i,
  /designer selection committee/i, /human rights commission/i, /library trustees/i, /cultural council/i,
  /neighborhood area council/i, /election commission/i, /home consortium/i, /committee packet/i,
];
const RELEVANT_PAGE_PATTERNS = [/historic district commission/i, /historic preservation/i, /urban design commission/i, /planning.*development/i];
const STREET_TYPES = new Map([["st", "street"], ["rd", "road"], ["ave", "avenue"], ["av", "avenue"], ["dr", "drive"], ["pkwy", "parkway"], ["pl", "place"], ["ln", "lane"], ["ct", "court"], ["cir", "circle"], ["ter", "terrace"], ["blvd", "boulevard"], ["way", "way"], ["hwy", "highway"]]);

function cleanText(value) { return String(value ?? "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); }
function normalize(value) { return cleanText(value).toLowerCase().replace(/[–—]/g, "-").replace(/[.,]/g, " ").replace(/\s+/g, " ").trim(); }
function normalizeStreet(value) { return normalize(value).split(" ").map((token) => STREET_TYPES.get(token) ?? token).join(" "); }
function absoluteUrl(value) { try { return new URL(value, BASE_URL).href; } catch { return null; } }
function isAllowedCityUrl(url) { try { const parsed = new URL(url); return parsed.protocol === "https:" && ALLOWED_HOSTS.has(parsed.hostname.toLowerCase()); } catch { return false; } }
function assertAllowedCityUrl(url) { if (!isAllowedCityUrl(url)) throw new Error(`Blocked non-City source URL: ${url}`); }
function isPdf(url) { return /\.pdf(?:[?#]|$)/i.test(url) || /showpublisheddocument/i.test(url); }

function extractLinks(html) {
  const links = [];
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attributes = match[1] ?? ""; const hrefMatch = attributes.match(/\bhref\s*=\s*["']([^"']+)["']/i); if (!hrefMatch) continue;
    const href = absoluteUrl(hrefMatch[1]); if (!href) continue;
    const titleMatch = attributes.match(/\btitle\s*=\s*["']([^"']+)["']/i); const ariaMatch = attributes.match(/\baria-label\s*=\s*["']([^"']+)["']/i); const text = cleanText(match[2]);
    links.push({ href, title: cleanText(titleMatch?.[1] ?? ariaMatch?.[1] ?? text), text });
  }
  return links;
}

function parseDate(text) {
  const value = cleanText(text);
  const titleDate = value.match(/\b(\d{2})-(\d{2})-(\d{2})\b/);
  if (titleDate) { const [, mm, dd, yy] = titleDate; const year = Number(yy) >= 70 ? 1900 + Number(yy) : 2000 + Number(yy); return `${year}-${mm}-${dd}`; }
  const numeric = value.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (numeric) { const [, mm, dd, yyyy] = numeric; return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`; }
  const named = value.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/i);
  if (named) { const months = { january: "01", february: "02", march: "03", april: "04", may: "05", june: "06", july: "07", august: "08", september: "09", october: "10", november: "11", december: "12" }; const [, month, day, year] = named; return `${year}-${months[month.toLowerCase()]}-${String(day).padStart(2, "0")}`; }
  return null;
}

function projectNameTerms(project) { return [...new Set(normalize(project.name).split(/\s+/).filter((term) => term.length >= 4 && !["project", "street", "road", "avenue", "city", "newton"].includes(term)))]; }
function projectAddressEvidence(project) {
  const normalizedAddress = normalize(project.address);
  const numericMatches = [...normalizedAddress.matchAll(/\b(\d{1,4}(?:-\d{1,4})?)\s+([a-z][a-z'-]+(?:\s+[a-z][a-z'-]+)?)\b/g)].map((match) => normalizeStreet(`${match[1]} ${match[2]}`));
  const streetMatches = [...normalizedAddress.matchAll(/\b([a-z][a-z'-]+(?:\s+[a-z][a-z'-]+)?)\s+(street|road|avenue|drive|parkway|place|way|lane|court|circle|terrace|boulevard)\b/g)].map((match) => normalizeStreet(`${match[1]} ${match[2]}`));
  return { numeric: [...new Set(numericMatches)], streets: [...new Set(streetMatches)] };
}
function projectMatchEvidence(text, project) {
  const normalized = normalize(text); const address = projectAddressEvidence(project); const exactNumeric = address.numeric.find((candidate) => normalized.includes(candidate));
  if (exactNumeric) return { matched: true, reason: "exact-address", evidence: exactNumeric };
  const exactStreets = address.streets.filter((street) => normalized.includes(street)); const nameTerms = projectNameTerms(project); const matchedNameTerms = nameTerms.filter((term) => normalized.includes(term));
  if (address.streets.length >= 2 && exactStreets.length >= 2) return { matched: true, reason: "multiple-streets", evidence: exactStreets.join(" + ") };
  if (exactStreets.length === 1 && nameTerms.length > 0 && matchedNameTerms.length >= Math.min(2, nameTerms.length)) return { matched: true, reason: "street-and-project-name", evidence: `${exactStreets[0]} + ${matchedNameTerms.join(" + ")}` };
  if (exactStreets.length === 1 && nameTerms.length === 0) { const name = normalize(project.name); if (name.length >= 12 && normalized.includes(name)) return { matched: true, reason: "project-name", evidence: name }; }
  return { matched: false, reason: null, evidence: null };
}
function hasNearbyPhrase(text, evidence, phrases, window = 1200) { const normalized = normalize(text); const escaped = evidence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); const match = new RegExp(escaped, "i").exec(normalized); if (!match) return false; const start = Math.max(0, match.index - window); const end = Math.min(normalized.length, match.index + match[0].length + window); return phrases.some((phrase) => phrase.test(normalized.slice(start, end))); }
function isRelevantPdfTitle(title) { const value = cleanText(title); if (BLOCKED_TITLE_PATTERNS.some((pattern) => pattern.test(value))) return false; return /\b(agenda|hearing|notice|memorandum|memo|decision|staff report)\b/i.test(value) || RELEVANT_PAGE_PATTERNS.some((pattern) => pattern.test(value)); }
function detectType(title, pdfText, evidence) { const titleValue = normalize(title); if (/public hearing notice|hearing notice/.test(titleValue)) return "Notice"; if (hasNearbyPhrase(pdfText, evidence, [/public hearing/, /hearing scheduled/, /public hearing will be held/])) return "Hearing"; if (/\bagenda\b/.test(titleValue)) return "Meeting"; if (/\bdecision\b|\bvote\b/.test(titleValue)) return "Decision"; return null; }
function bodyName(title, source) { const value = normalize(title); if (/urban design commission/.test(value)) return "Urban Design Commission"; if (/newton historical commission/.test(value)) return "Newton Historical Commission"; if (/auburndale historic district commission/.test(value)) return "Auburndale Historic District Commission"; if (/chestnut hill historic district commission/.test(value)) return "Chestnut Hill Historic District Commission"; if (/newton upper falls historic district commission/.test(value)) return "Newton Upper Falls Historic District Commission"; if (/newtonville historic district commission/.test(value)) return "Newtonville Historic District Commission"; if (/planning.*development/.test(value)) return "Planning & Development Board"; if (/historic district commission/.test(value)) return "Historic District Commission"; return source.body; }
function createEventId(projectId, date, type, sourceUrl) { return `${projectId}-${date}-${type}-${sourceUrl}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180); }

function parseExistingEvents(source) {
  const events = [];
  for (const match of source.matchAll(/\{\s*id:\s*"([^"]+)"[\s\S]*?verified:\s*true,\s*\}/g)) {
    const block = match[0]; const read = (field) => block.match(new RegExp(`${field}:\\s*"([^"]*)"`))?.[1]; const type = block.match(/type:\s*"([^"]*)"/)?.[1];
    const event = { id: read("id"), projectId: read("projectId"), date: read("date"), title: read("title"), description: read("description"), type, sourceUrl: read("sourceUrl"), verified: true };
    const participation = read("participationUrl"); const matchedAddress = read("matchedAddress"); const sourceCheckedAt = read("sourceCheckedAt");
    if (participation) event.participationUrl = participation; if (matchedAddress) event.matchedAddress = matchedAddress; if (sourceCheckedAt) event.sourceCheckedAt = sourceCheckedAt;
    if (event.id && event.projectId && event.date && event.title && event.description && event.type && event.sourceUrl) events.push(event);
  }
  return events;
}
function parseCatalogProjects(source) { const projects = []; for (const match of source.matchAll(/\{\s*id:\s*"([^"]+)"[\s\S]*?\n\s*\},/g)) { const block = match[0]; const id = match[1]; const name = block.match(/\n\s*name:\s*"([^"]+)"/)?.[1]; const address = block.match(/\n\s*address:\s*"([^"]+)"/)?.[1]; if (id && name && address) projects.push({ id, name, address }); } return projects; }
function mergeProjects(...groups) { const map = new Map(); for (const project of groups.flat()) if (project?.id && project?.name && project?.address) map.set(project.id, project); return [...map.values()]; }
function serializeEvents(events) {
  const lines = ['export type ProjectEventType =', '  | "Hearing"', '  | "Meeting"', '  | "Decision"', '  | "Application"', '  | "Notice"', '  | "Construction"', '  | "Other";', "", "export type ProjectEvent = {", "  id: string;", "  projectId: string;", "  date: string;", "  title: string;", "  description: string;", "  type: ProjectEventType;", "  sourceUrl: string;", "  participationUrl?: string;", "  matchedAddress?: string;", "  sourceCheckedAt?: string;", "  verified: true;", "};", "", "export const projectEvents: ProjectEvent[] = ["];
  const escape = (value) => String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n");
  for (const event of events) { lines.push("  {"); lines.push(`    id: "${escape(event.id)}",`); lines.push(`    projectId: "${escape(event.projectId)}",`); lines.push(`    date: "${escape(event.date)}",`); lines.push(`    title: "${escape(event.title)}",`); lines.push(`    description: "${escape(event.description)}",`); lines.push(`    type: "${escape(event.type)}",`); lines.push(`    sourceUrl: "${escape(event.sourceUrl)}",`); if (event.participationUrl) lines.push(`    participationUrl: "${escape(event.participationUrl)}",`); if (event.matchedAddress) lines.push(`    matchedAddress: "${escape(event.matchedAddress)}",`); if (event.sourceCheckedAt) lines.push(`    sourceCheckedAt: "${escape(event.sourceCheckedAt)}",`); lines.push("    verified: true,"); lines.push("  },"); }
  lines.push("];", ""); return lines.join("\n");
}
async function fetchText(url) { assertAllowedCityUrl(url); const response = await fetch(url, { headers: { "User-Agent": "Newton Development public-information collector" } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); assertAllowedCityUrl(response.url); return response.text(); }
async function fetchPdfText(url) { assertAllowedCityUrl(url); const response = await fetch(url, { headers: { "User-Agent": "Newton Development public-information collector" } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); assertAllowedCityUrl(response.url); const parser = new PDFParse({ data: Buffer.from(await response.arrayBuffer()) }); try { const result = await parser.getText(); return cleanText(result?.text ?? ""); } finally { await parser.destroy(); } }
async function collectSource(source, projects, checkedAt) {
  assertAllowedCityUrl(source.url); const firstPage = await fetchText(source.url); const pages = [{ url: source.url, html: firstPage }]; const firstLinks = extractLinks(firstPage);
  const childPages = firstLinks.filter((link) => isAllowedCityUrl(link.href) && !isPdf(link.href) && RELEVANT_PAGE_PATTERNS.some((pattern) => pattern.test(`${link.title} ${link.text}`)));
  for (const link of childPages.slice(0, 10)) { if (pages.some((page) => page.url === link.href)) continue; try { pages.push({ url: link.href, html: await fetchText(link.href) }); } catch (error) { console.log(`  Could not read linked page ${link.href}: ${error.message}`); } }
  const pdfLinks = []; for (const page of pages) for (const link of extractLinks(page.html)) if (isAllowedCityUrl(link.href) && isPdf(link.href) && isRelevantPdfTitle(link.title || link.text)) pdfLinks.push(link);
  const uniquePdfLinks = [...new Map(pdfLinks.map((link) => [link.href, link])).values()]; const discovered = [];
  for (const link of uniquePdfLinks) {
    try {
      const title = cleanText(link.title || link.text); const pdfText = await fetchPdfText(link.href); const combined = `${title}\n${pdfText}`;
      const matches = projects.map((project) => ({ project, evidence: projectMatchEvidence(combined, project) })).filter((item) => item.evidence.matched); if (matches.length === 0) continue;
      const date = parseDate(`${title}\n${pdfText}`); if (!date) continue;
      for (const { project, evidence } of matches) { const type = detectType(title, pdfText, evidence.evidence); if (!type) continue; const body = bodyName(title, source); discovered.push({ id: createEventId(project.id, date, type, link.href), projectId: project.id, date, title: type === "Hearing" ? `${body} hearing — ${project.name}` : type === "Notice" ? `${body} notice — ${project.name}` : type === "Decision" ? `${body} decision — ${project.name}` : `${body} meeting — ${project.name}`, description: type === "Hearing" ? `An official ${body} record identifies a public hearing concerning this project record.` : type === "Notice" ? `An official ${body} notice concerns this project record.` : type === "Decision" ? `An official ${body} record identifies a decision or vote concerning this project record.` : `An official ${body} agenda includes this project record.`, type, sourceUrl: link.href, participationUrl: link.href, matchedAddress: evidence.evidence, sourceCheckedAt: checkedAt, verified: true }); }
    } catch (error) { console.log(`  Could not read ${link.href}: ${error.message}`); }
  }
  return discovered;
}
function dedupe(events) { const map = new Map(); for (const event of events) { const key = `${event.projectId}|${event.date}|${event.type}|${event.sourceUrl}`; const existing = map.get(key); if (!existing || (!existing.participationUrl && event.participationUrl)) map.set(key, event); } return [...map.values()].sort((a, b) => a.date.localeCompare(b.date) || a.projectId.localeCompare(b.projectId) || a.sourceUrl.localeCompare(b.sourceUrl)); }

async function main() {
  const checkedAt = new Date().toISOString(); const projectData = JSON.parse(await fs.readFile(PROJECT_DATA_PATH, "utf8")); const publicProjectSource = await fs.readFile(PUBLIC_PROJECT_DATA_PATH, "utf8"); const transportationProjectSource = await fs.readFile(TRANSPORTATION_PROJECT_DATA_PATH, "utf8");
  const projects = mergeProjects(projectData.projects ?? [], parseCatalogProjects(publicProjectSource), parseCatalogProjects(transportationProjectSource)); if (!projects.length) throw new Error("Newton project catalog is empty.");
  const existing = parseExistingEvents(await fs.readFile(EVENTS_PATH, "utf8")); const discovered = []; const sourceResults = [];
  for (const source of SOURCES) { try { const events = await collectSource(source, projects, checkedAt); discovered.push(...events); sourceResults.push({ name: source.name, url: source.url, ok: true, discovered: events.length, checkedAt }); console.log(`${source.name}: ${events.length} verified project events discovered.`); } catch (error) { sourceResults.push({ name: source.name, url: source.url, ok: false, discovered: 0, error: error.message, checkedAt }); console.log(`${source.name}: source failed — ${error.message}`); } }
  if (sourceResults.length !== SOURCES.length) throw new Error("Event source health record count does not match configured sources.");
  if (sourceResults.some((source) => !source.ok)) throw new Error("One or more official Newton event sources failed; refusing to publish a partial refresh.");
  const combined = dedupe([...existing, ...discovered]); await fs.writeFile(EVENTS_PATH, serializeEvents(combined), "utf8");
  const status = { checkedAt, allowedHosts: [...ALLOWED_HOSTS], catalogProjectsChecked: projects.length, sources: sourceResults, successfulSources: sourceResults.filter((source) => source.ok).length, failedSources: sourceResults.filter((source) => !source.ok).length };
  await fs.writeFile(STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`, "utf8");
  console.log(`Checked ${projects.length} catalog projects.`); console.log(`Saved ${combined.length} verified project events.`); console.log(`New events from expanded sources: ${discovered.length}.`);
}
main().catch((error) => { console.error(error); process.exit(1); });
