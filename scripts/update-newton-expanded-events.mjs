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
const PROJECT_DATA_PATH = path.join(ROOT, "data", "newton-source.json");
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
  /finance/i, /public facilities/i, /public safety/i, /transportation/i, /traffic council/i,
  /programs\s*&\s*services/i, /real property/i, /school committee/i, /school department/i,
  /appropriation/i, /budget/i, /capital improvement/i, /capital projects/i, /\bcip\b/i,
  /committee of the whole/i, /chairs meeting/i, /rules subcommittee/i,
  /economic development commission/i, /community preservation committee/i, /parks\s*&\s*recreation/i,
  /designer selection committee/i, /human rights commission/i, /library trustees/i,
  /cultural council/i, /neighborhood area council/i, /election commission/i, /home consortium/i,
  /committee packet/i,
];

const RELEVANT_PAGE_PATTERNS = [
  /historic district commission/i,
  /historic preservation/i,
  /urban design commission/i,
  /planning.*development/i,
];

function cleanText(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value) {
  return cleanText(value).toLowerCase().replace(/[–—]/g, "-");
}

function absoluteUrl(value) {
  try { return new URL(value, BASE_URL).href; } catch { return null; }
}

function isPdf(url) {
  return /\.pdf(?:[?#]|$)/i.test(url) || /showpublisheddocument/i.test(url);
}

function isNewtonPage(url) {
  try { return new URL(url).hostname === "www.newtonma.gov"; } catch { return false; }
}

function extractLinks(html) {
  const links = [];
  const regex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(regex)) {
    const attributes = match[1] ?? "";
    const hrefMatch = attributes.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const href = absoluteUrl(hrefMatch[1]);
    if (!href) continue;
    const titleMatch = attributes.match(/\btitle\s*=\s*["']([^"']+)["']/i);
    const ariaMatch = attributes.match(/\baria-label\s*=\s*["']([^"']+)["']/i);
    const text = cleanText(match[2]);
    links.push({ href, title: cleanText(titleMatch?.[1] ?? ariaMatch?.[1] ?? text), text });
  }
  return links;
}

function parseDate(text) {
  const value = cleanText(text);
  const titleDate = value.match(/\b(\d{2})-(\d{2})-(\d{2})\b/);
  if (titleDate) {
    const [, mm, dd, yy] = titleDate;
    const year = Number(yy) >= 70 ? 1900 + Number(yy) : 2000 + Number(yy);
    return `${year}-${mm}-${dd}`;
  }
  const numeric = value.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (numeric) {
    const [, mm, dd, yyyy] = numeric;
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }
  const named = value.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})\b/i);
  if (named) {
    const months = { january: "01", february: "02", march: "03", april: "04", may: "05", june: "06", july: "07", august: "08", september: "09", october: "10", november: "11", december: "12" };
    const [, month, day, year] = named;
    return `${year}-${months[month.toLowerCase()]}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

function addressTokens(project) {
  const tokens = new Set();
  for (const value of [project.address, project.name]) {
    for (const match of normalize(value).matchAll(/\b(\d{1,4}(?:-\d{1,4})?)\s+([a-z][a-z'-]+)\b/g)) {
      tokens.add(`${match[1]} ${match[2]}`);
    }
  }
  return [...tokens];
}

function matchingTokens(text, project) {
  const normalized = normalize(text);
  return addressTokens(project).filter((token) => {
    const pattern = new RegExp(`\\b${token.replace(/[-]/g, "[-\\s]?")}\\b`, "i");
    return pattern.test(normalized);
  });
}

function hasNearbyPhrase(text, tokens, phrases, window = 1200) {
  const normalized = normalize(text);
  for (const token of tokens) {
    const pattern = new RegExp(`\\b${token.replace(/[-]/g, "[-\\s]?")}\\b`, "i");
    const match = pattern.exec(normalized);
    if (!match) continue;
    const start = Math.max(0, match.index - window);
    const end = Math.min(normalized.length, match.index + match[0].length + window);
    if (phrases.some((phrase) => phrase.test(normalized.slice(start, end)))) return true;
  }
  return false;
}

function isRelevantPdfTitle(title) {
  const value = cleanText(title);
  if (BLOCKED_TITLE_PATTERNS.some((pattern) => pattern.test(value))) return false;
  return /\b(agenda|hearing|notice)\b/i.test(value) || RELEVANT_PAGE_PATTERNS.some((pattern) => pattern.test(value));
}

function detectType(title, pdfText, project) {
  const titleValue = normalize(title);
  if (/public hearing notice|hearing notice/.test(titleValue)) return "Notice";
  if (hasNearbyPhrase(pdfText, matchingTokens(pdfText, project), [/public hearing/, /hearing scheduled/])) return "Hearing";
  if (/\bagenda\b/.test(titleValue)) return "Meeting";
  return null;
}

function bodyName(title, source) {
  const value = normalize(title);
  if (/urban design commission/.test(value)) return "Urban Design Commission";
  if (/newton historical commission/.test(value)) return "Newton Historical Commission";
  if (/auburndale historic district commission/.test(value)) return "Auburndale Historic District Commission";
  if (/chestnut hill historic district commission/.test(value)) return "Chestnut Hill Historic District Commission";
  if (/newton upper falls historic district commission/.test(value)) return "Newton Upper Falls Historic District Commission";
  if (/newtonville historic district commission/.test(value)) return "Newtonville Historic District Commission";
  if (/planning.*development/.test(value)) return "Planning & Development Board";
  if (/historic district commission/.test(value)) return "Historic District Commission";
  return source.body;
}

function createEventId(projectId, date, type, sourceUrl) {
  return `${projectId}-${date}-${type}-${sourceUrl}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180);
}

function parseExistingEvents(source) {
  const events = [];
  const objectRegex = /\{\s*id:\s*"([^"]+)"[\s\S]*?verified:\s*true,\s*\}/g;
  for (const match of source.matchAll(objectRegex)) {
    const block = match[0];
    const read = (field) => block.match(new RegExp(`${field}:\\s*"([^"]*)"`))?.[1];
    const type = block.match(/type:\s*"([^"]*)"/)?.[1];
    const participation = block.match(/participationUrl:\s*"([^"]*)"/)?.[1];
    const event = { id: read("id"), projectId: read("projectId"), date: read("date"), title: read("title"), description: read("description"), type, sourceUrl: read("sourceUrl"), verified: true };
    if (participation) event.participationUrl = participation;
    if (event.id && event.projectId && event.date && event.title && event.description && event.type && event.sourceUrl) events.push(event);
  }
  return events;
}

function serializeEvents(events) {
  const lines = [
    'export type ProjectEventType =',
    '  | "Hearing"',
    '  | "Meeting"',
    '  | "Decision"',
    '  | "Application"',
    '  | "Notice"',
    '  | "Construction"',
    '  | "Other";',
    "",
    "export type ProjectEvent = {",
    "  id: string;",
    "  projectId: string;",
    "  date: string;",
    "  title: string;",
    "  description: string;",
    "  type: ProjectEventType;",
    "  sourceUrl: string;",
    "  participationUrl?: string;",
    "  verified: true;",
    "};",
    "",
    "export const projectEvents: ProjectEvent[] = [",
  ];
  const escape = (value) => String(value ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n");
  for (const event of events) {
    lines.push("  {");
    lines.push(`    id: "${escape(event.id)}",`);
    lines.push(`    projectId: "${escape(event.projectId)}",`);
    lines.push(`    date: "${escape(event.date)}",`);
    lines.push(`    title: "${escape(event.title)}",`);
    lines.push(`    description: "${escape(event.description)}",`);
    lines.push(`    type: "${escape(event.type)}",`);
    lines.push(`    sourceUrl: "${escape(event.sourceUrl)}",`);
    if (event.participationUrl) lines.push(`    participationUrl: "${escape(event.participationUrl)}",`);
    lines.push("    verified: true,");
    lines.push("  },");
  }
  lines.push("];", "");
  return lines.join("\n");
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "User-Agent": "Newton Development public-information collector" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function fetchPdfText(url) {
  const response = await fetch(url, { headers: { "User-Agent": "Newton Development public-information collector" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const parser = new PDFParse({ data: Buffer.from(await response.arrayBuffer()) });
  try {
    const result = await parser.getText();
    return cleanText(result?.text ?? "");
  } finally {
    await parser.destroy();
  }
}

async function collectSource(source, projects) {
  const firstPage = await fetchText(source.url);
  const pages = [{ url: source.url, html: firstPage }];
  const firstLinks = extractLinks(firstPage);

  const childPages = firstLinks.filter((link) =>
    isNewtonPage(link.href) &&
    !isPdf(link.href) &&
    RELEVANT_PAGE_PATTERNS.some((pattern) => pattern.test(`${link.title} ${link.text}`))
  );

  for (const link of childPages.slice(0, 10)) {
    if (pages.some((page) => page.url === link.href)) continue;
    try {
      pages.push({ url: link.href, html: await fetchText(link.href) });
    } catch (error) {
      console.log(`  Could not read linked page ${link.href}: ${error.message}`);
    }
  }

  const pdfLinks = [];
  for (const page of pages) {
    for (const link of extractLinks(page.html)) {
      if (!isPdf(link.href) || !isRelevantPdfTitle(link.title || link.text)) continue;
      pdfLinks.push(link);
    }
  }

  const uniquePdfLinks = [...new Map(pdfLinks.map((link) => [link.href, link])).values()];
  const discovered = [];

  for (const link of uniquePdfLinks) {
    try {
      const title = cleanText(link.title || link.text);
      const pdfText = await fetchPdfText(link.href);
      const combined = `${title}\n${pdfText}`;
      const matchedProjects = projects.filter((project) => matchingTokens(combined, project).length > 0);
      if (matchedProjects.length === 0) continue;

      const date = parseDate(`${title}\n${pdfText}`);
      if (!date) continue;

      for (const project of matchedProjects) {
        const type = detectType(title, pdfText, project);
        if (!type) continue;
        const body = bodyName(title, source);
        discovered.push({
          id: createEventId(project.id, date, type, link.href),
          projectId: project.id,
          date,
          title: type === "Hearing" ? `${body} hearing — ${project.name}` : type === "Notice" ? `${body} notice — ${project.name}` : `${body} meeting — ${project.name}`,
          description: type === "Hearing" ? `An official ${body} record identifies a public hearing concerning this project.` : type === "Notice" ? `An official ${body} notice concerns this project or its development review.` : `An official ${body} agenda includes this project.`,
          type,
          sourceUrl: link.href,
          participationUrl: source.url,
          verified: true,
        });
      }
    } catch (error) {
      console.log(`  Could not read ${link.href}: ${error.message}`);
    }
  }

  return discovered;
}

function dedupe(events) {
  const map = new Map();
  for (const event of events) {
    const key = `${event.projectId}|${event.date}|${event.type}`;
    const existing = map.get(key);
    if (!existing || (!existing.participationUrl && event.participationUrl)) map.set(key, event);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date) || a.projectId.localeCompare(b.projectId));
}

async function main() {
  const projectData = JSON.parse(await fs.readFile(PROJECT_DATA_PATH, "utf8"));
  const projects = projectData.projects ?? [];
  if (!projects.length) throw new Error("Newton project data is empty.");

  const existing = parseExistingEvents(await fs.readFile(EVENTS_PATH, "utf8"));
  const discovered = [];
  const sourceResults = [];

  for (const source of SOURCES) {
    try {
      const events = await collectSource(source, projects);
      discovered.push(...events);
      sourceResults.push({ name: source.name, url: source.url, ok: true, discovered: events.length });
      console.log(`${source.name}: ${events.length} verified project events discovered.`);
    } catch (error) {
      sourceResults.push({ name: source.name, url: source.url, ok: false, error: error.message });
      console.log(`${source.name}: source failed — ${error.message}`);
    }
  }

  const combined = dedupe([...existing, ...discovered]);
  await fs.writeFile(EVENTS_PATH, serializeEvents(combined), "utf8");

  const status = {
    checkedAt: new Date().toISOString(),
    sources: sourceResults,
    successfulSources: sourceResults.filter((source) => source.ok).length,
    failedSources: sourceResults.filter((source) => !source.ok).length,
  };
  await fs.writeFile(STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`, "utf8");

  console.log(`Saved ${combined.length} verified project events.`);
  console.log(`New events from expanded sources: ${discovered.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
