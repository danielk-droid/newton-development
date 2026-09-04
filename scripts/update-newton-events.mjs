import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const PROJECT_DATA_PATH = path.join(
  ROOT,
  "data",
  "newton-source.json"
);

const EVENTS_PATH = path.join(
  ROOT,
  "data",
  "project-events.ts"
);

const BASE_URL = "https://www.newtonma.gov";

const SOURCES = [
  {
    name: "Newton Electronic Posting Board",
    url:
      `${BASE_URL}/government/city-clerk/city-council/` +
      "electronic-posting-board",
  },
  {
    name: "Newton Friday Packet Archives",
    url:
      `${BASE_URL}/government/city-clerk/city-council/` +
      "friday-packet/friday-packet-archives",
  },
];

/*
 * Only development-review bodies and documents are allowed.
 */
const ALLOWED_DOCUMENT_PATTERNS = [
  /land use committee/i,
  /zoning\s*&?\s*planning/i,
  /zoning board of appeals/i,
  /\bzba\b/i,
  /planning\s*&\s*development/i,
  /planning department/i,
  /conservation commission/i,
  /historic district commission/i,
];

/*
 * Generic municipal documents are explicitly blocked.
 */
const BLOCKED_DOCUMENT_PATTERNS = [
  /finance/i,
  /financial audit/i,
  /public facilities/i,
  /public safety/i,
  /transportation/i,
  /traffic council/i,
  /programs\s*&\s*services/i,
  /real property/i,
  /school committee/i,
  /school department/i,
  /appropriation/i,
  /budget/i,
  /capital improvement/i,
  /capital projects/i,
  /\bcip\b/i,
  /committee of the whole/i,
  /chairs meeting/i,
  /rules subcommittee/i,
  /economic development commission/i,
  /community preservation committee/i,
  /parks\s*&\s*recreation/i,
  /designer selection committee/i,
  /human rights commission/i,
  /library trustees/i,
  /cultural council/i,
  /neighborhood area council/i,
  /election commission/i,
  /home consortium/i,
  /committee packet/i,
];

/*
 * Exact source URLs previously confirmed to be false positives.
 */
const KNOWN_BAD_SOURCE_URLS = new Set([
  "https://www.newtonma.gov/home/showpublisheddocument/133446/638979557154270000",
  "https://www.newtonma.gov/home/showpublisheddocument/134367/639004542394300000",
  "https://www.newtonma.gov/home/showpublisheddocument/134427/639008159211370000",
  "https://www.newtonma.gov/home/showpublisheddocument/134574/639011458675370000",
  "https://www.newtonma.gov/home/showpublisheddocument/135670/639053893821970000",
  "https://www.newtonma.gov/home/showpublisheddocument/138550/639138523156970000",
]);

/*
 * Project/date/type combinations that have been manually verified
 * as false positives.
 *
 * The February 9, 2026 Zoning & Planning documents do not contain
 * a West Newton Armory project item. The previous matching logic
 * nevertheless associated the document with the Armory.
 */
const KNOWN_BAD_PROJECT_EVENTS = new Set([
  [
    "west-newton-armory-1135-1137-washington-street-west-newton",
    "2026-02-09",
    "Application",
  ].join("|"),
]);

const PROJECT_KEYWORDS = {
  "38-crafts-street-newtonville": [
    "38 Crafts Street",
    "38 Crafts St",
    "38 Crafts",
    "896385",
  ],

  "528-boylston-street-rt-9-thompsonville": [
    "528 Boylston Street",
    "528 Boylston St",
    "528 Boylston",
  ],

  "northland-charlemont-160-charlemont-st-newton-highlands": [
    "160 Charlemont Street",
    "160 Charlemont St",
    "160 Charlemont",
    "Northland Charlemont",
  ],

  "78-crafts-street-newtonville": [
    "78 Crafts Street",
    "78 Crafts St",
    "78 Crafts",
  ],

  "riverside-mbta-riverside-t-station-355-grove-st-and-399-grove-st-auburndale":
    [
      "355 Grove Street",
      "355 Grove St",
      "399 Grove Street",
      "399 Grove St",
      "Riverside T Station",
      "Riverside Station",
    ],

  "134-hancock-street-and-161-163-and-169-grove-street-auburndale": [
    "134 Hancock Street",
    "134 Hancock St",
    "161-163 Grove Street",
    "161-163 Grove St",
    "169 Grove Street",
    "169 Grove St",
  ],

  "portion-of-former-walker-center-for-ecumenical-exchange-138-144-hancock-street-auburndale":
    [
      "138-144 Hancock Street",
      "138-144 Hancock St",
      "138 Hancock Street",
      "144 Hancock Street",
      "Walker Center",
      "Ecumenical Exchange",
    ],

  "northland-needham-street-275-281-needham-st-156-oak-st-55-tower-rd-upper-falls-400-main-st-340-main-st":
    [
      "275 Needham Street",
      "275 Needham St",
      "281 Needham Street",
      "281 Needham St",
      "156 Oak Street",
      "156 Oak St",
      "55 Tower Road",
      "55 Tower Rd",
      "400 Main Street",
      "400 Main St",
      "340 Main Street",
      "340 Main St",
    ],

  "newton-gardens-acquisition-132-north-street-west-newton": [
    "132 North Street",
    "132 North St",
    "Newton Gardens",
  ],

  "41-washington-street-newton-corner": [
    "41 Washington Street",
    "41 Washington St",
  ],

  "west-newton-armory-1135-1137-washington-street-west-newton": [
    "1135 Washington Street",
    "1135 Washington St",
    "1137 Washington Street",
    "1137 Washington St",
    "West Newton Armory",
  ],

  "dunstan-east-newton-crossing-1149-1185-washington-st-and-kempton-pl":
    [
      "1149 Washington Street",
      "1149 Washington St",
      "1185 Washington Street",
      "1185 Washington St",
      "Kempton Place",
      "Kempton Pl",
      "Newton Crossing",
      "Dunstan East",
    ],

  "386-390-watertown-street-nonantum": [
    "386 Watertown Street",
    "386 Watertown St",
    "390 Watertown Street",
    "390 Watertown St",
  ],
};

const PARTICIPATION_URLS = {
  zba:
    `${BASE_URL}/government/planning/` +
    "zoning-board-of-appeals",

  landUse:
    `${BASE_URL}/government/city-clerk/city-council/` +
    "council-standing-committees/land-use-committee",

  planning: `${BASE_URL}/government/planning`,

  conservation:
    `${BASE_URL}/government/planning/` +
    "conservation-office",

  historic:
    `${BASE_URL}/government/planning/` +
    "historic-preservation",
};

function absoluteUrl(value) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, BASE_URL).href;
  } catch {
    return null;
  }
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();
}

function htmlDecode(value) {
  return cleanText(
    String(value ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&nbsp;/g, " ")
  );
}

function normalizeWhitespace(value) {
  return String(value ?? "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeTs(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\\n");
}

function parseDateFromTitle(title) {
  const match = title.match(
    /\b(\d{2})-(\d{2})-(\d{2})\b/
  );

  if (!match) {
    return null;
  }

  const [, mm, dd, yy] = match;

  const year =
    Number(yy) >= 70
      ? 1900 + Number(yy)
      : 2000 + Number(yy);

  return `${year}-${mm}-${dd}`;
}

function parseDateFromText(text) {
  const normalized = normalizeWhitespace(text);

  const mmddyyyy = normalized.match(
    /\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/
  );

  if (mmddyyyy) {
    const [, mm, dd, yyyy] = mmddyyyy;

    return (
      `${yyyy}-${String(mm).padStart(2, "0")}-` +
      `${String(dd).padStart(2, "0")}`
    );
  }

  const monthDate = normalized.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d{2})\b/i
  );

  if (monthDate) {
    const [, monthName, day, year] = monthDate;

    const months = {
      january: "01",
      february: "02",
      march: "03",
      april: "04",
      may: "05",
      june: "06",
      july: "07",
      august: "08",
      september: "09",
      october: "10",
      november: "11",
      december: "12",
    };

    return (
      `${year}-${months[monthName.toLowerCase()]}-` +
      `${String(day).padStart(2, "0")}`
    );
  }

  return null;
}

function isAllowedDevelopmentDocument(title) {
  const normalizedTitle = cleanText(title);

  if (
    BLOCKED_DOCUMENT_PATTERNS.some((pattern) =>
      pattern.test(normalizedTitle)
    )
  ) {
    return false;
  }

  return ALLOWED_DOCUMENT_PATTERNS.some((pattern) =>
    pattern.test(normalizedTitle)
  );
}

function detectEventType(title, text) {
  const titleValue = cleanText(title).toLowerCase();

  const value =
    `${title}\n${text}`.toLowerCase();

  if (
    /\bpublic hearing notice\b/.test(titleValue) ||
    /\bhearing notice\b/.test(titleValue)
  ) {
    return "Notice";
  }

  if (
    /\bpublic hearing\b/.test(value) ||
    /\bhearing\s+scheduled\b/.test(value)
  ) {
    return "Hearing";
  }

  if (
    /\bdecision\b/.test(value) ||
    /\bvote\b/.test(value) ||
    /\bvoted\b/.test(value)
  ) {
    return "Decision";
  }

  if (
    /\bapplication\b/.test(value) &&
    (
      /\bspecial permit\b/.test(value) ||
      /\bcomprehensive permit\b/.test(value) ||
      /\bzoning board of appeals\b/.test(value) ||
      /\bzba\b/.test(value) ||
      /\bland use committee\b/.test(value)
    )
  ) {
    return "Application";
  }

  if (
    (
      /\bzoning board of appeals\b/.test(value) ||
      /\bzba\b/.test(value) ||
      /\bland use committee\b/.test(value) ||
      /zoning\s*&?\s*planning/.test(value) ||
      /planning\s*&\s*development/.test(value) ||
      /\bplanning department\b/.test(value) ||
      /\bconservation commission\b/.test(value) ||
      /\bhistoric district commission\b/.test(value)
    ) &&
    (
      /\bagenda\b/.test(titleValue) ||
      /\bmeeting\b/.test(titleValue)
    )
  ) {
    return "Meeting";
  }

  return null;
}

function getParticipationUrl(title, text) {
  const value =
    `${title} ${text}`.toLowerCase();

  if (
    value.includes("zoning board of appeals") ||
    /\bzba\b/.test(value)
  ) {
    return PARTICIPATION_URLS.zba;
  }

  if (
    value.includes("land use committee") ||
    value.includes("city council")
  ) {
    return PARTICIPATION_URLS.landUse;
  }

  if (value.includes("planning & development")) {
    return PARTICIPATION_URLS.planning;
  }

  if (value.includes("conservation")) {
    return PARTICIPATION_URLS.conservation;
  }

  if (value.includes("historic district")) {
    return PARTICIPATION_URLS.historic;
  }

  return undefined;
}

function extractLinks(html) {
  const links = [];

  const regex =
    /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(regex)) {
    const attributes = match[1] ?? "";
    const innerHtml = match[2] ?? "";

    const hrefMatch = attributes.match(
      /\bhref\s*=\s*["']([^"']+)["']/i
    );

    if (!hrefMatch) {
      continue;
    }

    const href = absoluteUrl(hrefMatch[1]);

    if (!href) {
      continue;
    }

    const titleMatch = attributes.match(
      /\btitle\s*=\s*["']([^"']+)["']/i
    );

    const ariaMatch = attributes.match(
      /\baria-label\s*=\s*["']([^"']+)["']/i
    );

    const text = htmlDecode(innerHtml);

    const title = cleanText(
      titleMatch?.[1] ??
        ariaMatch?.[1] ??
        text
    );

    links.push({
      href,
      title,
      text,
    });
  }

  return links;
}

function isPdf(url) {
  return (
    /\.pdf(?:[?#]|$)/i.test(url) ||
    /showpublisheddocument/i.test(url)
  );
}

function isRelevantDocument(title) {
  const normalizedTitle = cleanText(title);

  return isAllowedDevelopmentDocument(
    normalizedTitle
  );
}

function scoreKeyword(keyword) {
  const normalized = keyword.toLowerCase();

  if (
    /\b\d{1,4}\s+[a-z0-9-]+\s+(street|st|road|rd|place|pl)\b/.test(
      normalized
    )
  ) {
    return 3;
  }

  if (
    /^\d{1,4}\s+[a-z0-9-]+/.test(normalized)
  ) {
    return 3;
  }

  if (
    normalized.includes("896385") ||
    normalized.includes("riverside t station") ||
    normalized.includes("newton crossing") ||
    normalized.includes("dunstan east") ||
    normalized.includes("northland charlemont") ||
    normalized.includes("west newton armory") ||
    normalized.includes("walker center") ||
    normalized.includes("ecumenical exchange") ||
    normalized.includes("newton gardens")
  ) {
    return 2;
  }

  return 1;
}

function findStrongProjectMatch(text, projects) {
  const normalized =
    normalizeWhitespace(text).toLowerCase();

  const candidates = [];

  for (const project of projects) {
    const keywords =
      PROJECT_KEYWORDS[project.slug] ?? [];

    const matchedKeywords = keywords.filter(
      (keyword) =>
        normalized.includes(
          keyword.toLowerCase()
        )
    );

    if (matchedKeywords.length === 0) {
      continue;
    }

    const score = matchedKeywords.reduce(
      (total, keyword) =>
        total + scoreKeyword(keyword),
      0
    );

    const hasStrongAddressMatch =
      matchedKeywords.some((keyword) =>
        /^\d{1,4}\s+[a-z0-9-]+\s+(street|st|road|rd|place|pl)\b/i.test(
          keyword
        )
      );

    candidates.push({
      project,
      matchedKeywords,
      score,
      hasStrongAddressMatch,
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return (
      b.matchedKeywords.length -
      a.matchedKeywords.length
    );
  });

  const top = candidates[0];

  if (candidates.length === 1) {
    return top.hasStrongAddressMatch ||
      top.score >= 2
      ? top.project
      : null;
  }

  const second = candidates[1];

  if (top.score === second.score) {
    return null;
  }

  if (top.score < second.score + 2) {
    return null;
  }

  return top.project;
}

function hasStrongEventEvidence(
  title,
  text,
  eventType
) {
  const titleValue =
    cleanText(title).toLowerCase();

  const value =
    `${title}\n${text}`.toLowerCase();

  if (!eventType) {
    return false;
  }

  if (eventType === "Hearing") {
    return (
      /\bpublic hearing\b/.test(value) ||
      /\bhearing notice\b/.test(value) ||
      /\bhearing\s+scheduled\b/.test(value)
    );
  }

  if (eventType === "Decision") {
    return (
      /\bdecision\b/.test(value) ||
      /\bvote\b/.test(value) ||
      /\bvoted\b/.test(value)
    );
  }

  if (eventType === "Application") {
    return (
      /\bapplication\b/.test(value) &&
      (
        /\bspecial permit\b/.test(value) ||
        /\bcomprehensive permit\b/.test(value) ||
        /\bzoning board of appeals\b/.test(value) ||
        /\bzba\b/.test(value) ||
        /\bland use committee\b/.test(value)
      )
    );
  }

  if (eventType === "Notice") {
    return (
      /\bpublic hearing notice\b/.test(value) ||
      /\bhearing notice\b/.test(value)
    );
  }

  if (eventType === "Meeting") {
    const allowedBodyInTitle =
      /\bland use committee\b/.test(titleValue) ||
      /zoning\s*&?\s*planning/.test(titleValue) ||
      /\bzoning board of appeals\b/.test(titleValue) ||
      /\bzba\b/.test(titleValue) ||
      /planning\s*&\s*development/.test(titleValue) ||
      /\bplanning department\b/.test(titleValue) ||
      /\bconservation commission\b/.test(titleValue) ||
      /\bhistoric district commission\b/.test(titleValue);

    const agendaInTitle =
      /\bagenda\b/.test(titleValue) ||
      /\bmeeting\b/.test(titleValue) ||
      /\bmemo\b/.test(titleValue) ||
      /\breport\b/.test(titleValue) ||
      /\brecommendation\b/.test(titleValue);

    return (
      allowedBodyInTitle &&
      agendaInTitle
    );
  }

  return false;
}

function buildDescription(eventType, title) {
  if (eventType === "Hearing") {
    if (/scheduled/i.test(title)) {
      return (
        "An official Newton document schedules or " +
        "identifies a public hearing concerning this project."
      );
    }

    return (
      "An official Newton document identifies a " +
      "public hearing concerning this project."
    );
  }

  if (eventType === "Decision") {
    return (
      "An official Newton document identifies a " +
      "decision or vote concerning this project."
    );
  }

  if (eventType === "Application") {
    return (
      "An official Newton document identifies " +
      "development application activity concerning this project."
    );
  }

  if (eventType === "Notice") {
    return (
      "An official Newton notice concerns this " +
      "project or its development review process."
    );
  }

  if (eventType === "Meeting") {
    return (
      "An official Newton agenda or meeting document " +
      "places this project on the agenda."
    );
  }

  return (
    "An official Newton document concerns this project."
  );
}

function chooseEventTitle(
  title,
  eventType,
  project
) {
  const projectName = project.name;

  if (eventType === "Hearing") {
    if (/zoning board of appeals/i.test(title)) {
      return (
        `Zoning Board of Appeals hearing — ` +
        projectName
      );
    }

    if (/land use committee/i.test(title)) {
      return (
        `Land Use Committee hearing — ` +
        projectName
      );
    }

    return `Public hearing — ${projectName}`;
  }

  if (eventType === "Meeting") {
    if (/zoning board of appeals/i.test(title)) {
      return (
        `Zoning Board of Appeals meeting — ` +
        projectName
      );
    }

    if (/zoning\s*&?\s*planning/i.test(title)) {
      return (
        `Zoning & Planning meeting — ` +
        projectName
      );
    }

    if (/planning\s*&\s*development/i.test(title)) {
      return (
        `Planning & Development meeting — ` +
        projectName
      );
    }

    if (/land use committee/i.test(title)) {
      return (
        `Land Use Committee meeting — ` +
        projectName
      );
    }

    return `Official meeting — ${projectName}`;
  }

  if (eventType === "Decision") {
    return `Official decision — ${projectName}`;
  }

  if (eventType === "Notice") {
    return `Official notice — ${projectName}`;
  }

  if (eventType === "Application") {
    return (
      `Development application activity — ` +
      projectName
    );
  }

  return `Official development record — ${projectName}`;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Newton Development public-information collector",
    },
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} for ${url}`
    );
  }

  return response.text();
}

async function fetchPdfText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Newton Development public-information collector",
    },
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} for ${url}`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  const parser = new PDFParse({
    data: buffer,
  });

  try {
    const result =
      await parser.getText();

    return normalizeWhitespace(
      result?.text ?? ""
    );
  } finally {
    await parser.destroy();
  }
}

function parseExistingEvents(source) {
  const events = [];

  const objectRegex =
    /\{\s*id:\s*"([^"]+)"[\s\S]*?verified:\s*true,\s*\}/g;

  for (const match of source.matchAll(objectRegex)) {
    const block = match[0];

    const read = (field) => {
      const fieldRegex = new RegExp(
        `${field}:\\s*"([^"]*)"`
      );

      return block.match(fieldRegex)?.[1];
    };

    const participationMatch =
      block.match(
        /participationUrl:\s*"([^"]*)"/
      );

    const typeMatch =
      block.match(
        /type:\s*"([^"]*)"/
      );

    const event = {
      id: read("id"),
      projectId: read("projectId"),
      date: read("date"),
      title: read("title"),
      description: read("description"),
      type: typeMatch?.[1],
      sourceUrl: read("sourceUrl"),
      verified: true,
    };

    if (participationMatch) {
      event.participationUrl =
        participationMatch[1];
    }

    if (
      event.id &&
      event.projectId &&
      event.date &&
      event.title &&
      event.description &&
      event.type &&
      event.sourceUrl
    ) {
      events.push(event);
    }
  }

  return events;
}

function eventTypePriority(type) {
  const priorities = {
    Decision: 6,
    Hearing: 5,
    Notice: 4,
    Application: 3,
    Meeting: 2,
    Construction: 1,
    Other: 0,
  };

  return priorities[type] ?? 0;
}

function isKnownBadProjectEvent(event) {
  return KNOWN_BAD_PROJECT_EVENTS.has(
    [
      event.projectId,
      event.date,
      event.type,
    ].join("|")
  );
}

function cleanExistingEvents(events) {
  const cleaned = [];

  for (const event of events) {
    if (
      event.type === "Construction" &&
      /official development record/i.test(
        event.title
      )
    ) {
      continue;
    }

    if (
      KNOWN_BAD_SOURCE_URLS.has(
        absoluteUrl(event.sourceUrl)
      )
    ) {
      console.log(
        `Removing known false positive: ${event.title} (${event.date})`
      );
      continue;
    }

    if (isKnownBadProjectEvent(event)) {
      console.log(
        `Removing known false-positive project event: ${event.title} (${event.date})`
      );
      continue;
    }

    cleaned.push(event);
  }

  const sourceMap = new Map();

  for (const event of cleaned) {
    const key =
      `${event.projectId}|${event.date}|${event.sourceUrl}`;

    const existing = sourceMap.get(key);

    if (!existing) {
      sourceMap.set(key, event);
      continue;
    }

    if (
      eventTypePriority(event.type) >
      eventTypePriority(existing.type)
    ) {
      sourceMap.set(key, event);
    }
  }

  const finalMap = new Map();

  for (const event of sourceMap.values()) {
    const key =
      `${event.projectId}|${event.date}|${event.type}`;

    if (!finalMap.has(key)) {
      finalMap.set(key, event);
    }
  }

  return [...finalMap.values()];
}

function serializeEvents(events) {
  const lines = [];

  lines.push(
    "export type ProjectEventType ="
  );
  lines.push('  | "Hearing"');
  lines.push('  | "Meeting"');
  lines.push('  | "Decision"');
  lines.push('  | "Application"');
  lines.push('  | "Notice"');
  lines.push('  | "Construction"');
  lines.push('  | "Other";');
  lines.push("");

  lines.push(
    "export type ProjectEvent = {"
  );
  lines.push("  id: string;");
  lines.push("  projectId: string;");
  lines.push("  date: string;");
  lines.push("  title: string;");
  lines.push("  description: string;");
  lines.push("  type: ProjectEventType;");
  lines.push("  sourceUrl: string;");
  lines.push(
    "  participationUrl?: string;"
  );
  lines.push("  verified: true;");
  lines.push("};");
  lines.push("");

  lines.push(
    "export const projectEvents: ProjectEvent[] = ["
  );

  for (const event of events) {
    lines.push("  {");

    lines.push(
      `    id: "${escapeTs(event.id)}",`
    );

    lines.push(
      `    projectId: "${escapeTs(
        event.projectId
      )}",`
    );

    lines.push(
      `    date: "${escapeTs(event.date)}",`
    );

    lines.push(
      `    title: "${escapeTs(event.title)}",`
    );

    lines.push(
      `    description: "${escapeTs(
        event.description
      )}",`
    );

    lines.push(
      `    type: "${escapeTs(event.type)}",`
    );

    lines.push(
      `    sourceUrl: "${escapeTs(
        event.sourceUrl
      )}",`
    );

    if (event.participationUrl) {
      lines.push(
        `    participationUrl: "${escapeTs(
          event.participationUrl
        )}",`
      );
    }

    lines.push("    verified: true,");
    lines.push("  },");
  }

  lines.push("];");
  lines.push("");

  return lines.join("\n");
}

function createEventId(
  projectId,
  date,
  type,
  sourceUrl
) {
  const normalized =
    `${projectId}-${date}-${type}-${sourceUrl}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return normalized.slice(0, 180);
}

async function collectFromSource(
  source,
  projects
) {
  console.log(
    `Fetching ${source.name}...`
  );

  const html =
    await fetchText(source.url);

  const links =
    extractLinks(html);

  const candidateLinks =
    links.filter((link) => {
      if (!isPdf(link.href)) {
        return false;
      }

      if (
        KNOWN_BAD_SOURCE_URLS.has(
          link.href
        )
      ) {
        return false;
      }

      return isRelevantDocument(
        link.title || link.text
      );
    });

  console.log(
    `Found ${candidateLinks.length} potentially relevant official documents.`
  );

  const candidates = [];

  for (const link of candidateLinks) {
    const title = cleanText(
      link.title || link.text
    );

    const titleDate =
      parseDateFromTitle(title);

    try {
      console.log(
        `  Reading: ${title}`
      );

      const pdfText =
        await fetchPdfText(link.href);

      if (!pdfText) {
        console.log(
          "    No extractable PDF text."
        );
        continue;
      }

      if (
        !isAllowedDevelopmentDocument(title)
      ) {
        console.log(
          "    Skipped: document is not an allowed development-review document."
        );
        continue;
      }

      if (
        KNOWN_BAD_SOURCE_URLS.has(
          link.href
        )
      ) {
        console.log(
          "    Skipped: known false-positive source."
        );
        continue;
      }

      const combinedText =
        `${title}\n${pdfText}`;

      const project =
        findStrongProjectMatch(
          combinedText,
          projects
        );

      if (!project) {
        continue;
      }

      const date =
        titleDate ||
        parseDateFromText(pdfText);

      if (!date) {
        console.log(
          `    Matched ${project.name}, but no reliable date was found.`
        );
        continue;
      }

      const eventType =
        detectEventType(
          title,
          pdfText
        );

      if (!eventType) {
        console.log(
          `    Matched ${project.name}, but no supported event type was established.`
        );
        continue;
      }

      /*
       * Check manually confirmed false positives
       * before creating the event.
       */
      if (
        KNOWN_BAD_PROJECT_EVENTS.has(
          [
            project.slug,
            date,
            eventType,
          ].join("|")
        )
      ) {
        console.log(
          `    Skipped known false-positive project event: ${project.name} (${date}, ${eventType})`
        );
        continue;
      }

      if (
        !hasStrongEventEvidence(
          title,
          pdfText,
          eventType
        )
      ) {
        console.log(
          `    Skipped ${project.name}: insufficient event evidence.`
        );
        continue;
      }

      const event = {
        id: createEventId(
          project.slug,
          date,
          eventType,
          link.href
        ),

        projectId:
          project.slug,

        date,

        title:
          chooseEventTitle(
            title,
            eventType,
            project
          ),

        description:
          buildDescription(
            eventType,
            title
          ),

        type: eventType,

        sourceUrl:
          link.href,

        participationUrl:
          getParticipationUrl(
            title,
            pdfText
          ),

        verified: true,
      };

      candidates.push(event);

      console.log(
        `    Accepted project event: ${project.name} (${date}, ${eventType})`
      );
    } catch (error) {
      console.log(
        `    Could not read document: ${error.message}`
      );
    }
  }

  return candidates;
}

function deduplicateEvents(events) {
  const map = new Map();

  for (const event of events) {
    if (isKnownBadProjectEvent(event)) {
      continue;
    }

    const key =
      `${event.projectId}|${event.date}|${event.type}`;

    const existing =
      map.get(key);

    if (!existing) {
      map.set(key, event);
      continue;
    }

    if (
      !existing.participationUrl &&
      event.participationUrl
    ) {
      map.set(key, event);
    }
  }

  return [...map.values()];
}

async function main() {
  console.log(
    "Updating Newton project events..."
  );

  const projectData =
    JSON.parse(
      await fs.readFile(
        PROJECT_DATA_PATH,
        "utf8"
      )
    );

  const projects =
    projectData.projects ?? [];

  if (projects.length === 0) {
    throw new Error(
      "Newton project data is empty."
    );
  }

  const existingSource =
    await fs.readFile(
      EVENTS_PATH,
      "utf8"
    );

  const parsedExisting =
    parseExistingEvents(
      existingSource
    );

  const existingEvents =
    cleanExistingEvents(
      parsedExisting
    );

  console.log(
    `Preserving ${existingEvents.length} existing verified events after cleanup.`
  );

  const discovered = [];

  for (const source of SOURCES) {
    try {
      const sourceEvents =
        await collectFromSource(
          source,
          projects
        );

      discovered.push(
        ...sourceEvents
      );

      console.log(
        `Discovered ${sourceEvents.length} verified project events from ${source.name}.`
      );
    } catch (error) {
      console.log(
        `Source failed: ${error.message}`
      );
    }
  }

  const combined =
    deduplicateEvents([
      ...existingEvents,
      ...discovered,
    ]);

  combined.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(
        b.date
      );
    }

    return a.projectId.localeCompare(
      b.projectId
    );
  });

  await fs.writeFile(
    EVENTS_PATH,
    serializeEvents(combined),
    "utf8"
  );

  const existingKeys = new Set(
    existingEvents.map(
      (event) =>
        `${event.projectId}|${event.date}|${event.type}`
    )
  );

  const genuinelyNew =
    discovered.filter(
      (event) =>
        !existingKeys.has(
          `${event.projectId}|${event.date}|${event.type}`
        )
    );

  console.log(
    `Saved ${combined.length} verified project events.`
  );

  console.log(
    `Newly discovered events: ${genuinelyNew.length}.`
  );

  console.log(
    "Event collection completed."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});