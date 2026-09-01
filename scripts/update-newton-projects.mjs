import fs from "node:fs/promises";

const SOURCE_URL =
  "https://www.newtonma.gov/government/planning/development-projects";

const OUTPUT_FILE = "data/newton-source.json";

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(text) {
  let result = text;

  for (let i = 0; i < 3; i++) {
    result = decodeHtml(result);
  }

  return result
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractLinks(html) {
  const links = [];

  const pattern =
    /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(pattern)) {
    const href = match[1];
    const label = cleanText(match[2]);

    if (!href || !label) {
      continue;
    }

    const url = href.startsWith("http")
      ? href
      : new URL(href, SOURCE_URL).href;

    if (!links.some((link) => link.url === url)) {
      links.push({
        label,
        url,
      });
    }
  }

  return links;
}

function extractVillage(name) {
  const villages = [
    "Auburndale",
    "Chestnut Hill",
    "Newton Centre",
    "Newton Corner",
    "Newton Highlands",
    "Newton Lower Falls",
    "Newton Upper Falls",
    "Newtonville",
    "Nonantum",
    "Oak Hill",
    "Thompsonville",
    "Waban",
    "West Newton",
  ];

  const cleanedName = cleanText(name).toLowerCase();

  const village = villages.find((item) =>
    cleanedName.includes(item.toLowerCase())
  );

  return village ?? "Unknown";
}

function standardizeStatus(rawStatus) {
  const status = cleanText(rawStatus).toLowerCase();

  if (status.includes("under construction")) {
    return "Under Construction";
  }

  if (
    status.includes("complete") ||
    status.includes("completed")
  ) {
    return "Completed";
  }

  if (
    status.includes("denied") &&
    status.includes("appeal")
  ) {
    return "Appealed";
  }

  if (status.includes("denied")) {
    return "Denied";
  }

  if (status.includes("withdrawn")) {
    return "Withdrawn";
  }

  if (status.includes("continued")) {
    return "Continued";
  }

  if (
    status.includes("scheduled") ||
    status.includes("hearing")
  ) {
    return "Scheduled for Hearing";
  }

  if (status.includes("filed")) {
    return "Submitted";
  }

  if (
    status.includes("approved with conditions") ||
    status.includes("approval with conditions")
  ) {
    return "Approved with Conditions";
  }

  if (status.includes("approved")) {
    return "Approved";
  }

  if (
    status.includes("proposed") ||
    status.includes("proposal")
  ) {
    return "Proposed";
  }

  return "Unknown";
}

function extractFacts(description) {
  const facts = {
    units: null,
    affordableUnits: null,
    stories: null,
    parkingSpaces: null,
  };

  const unitsMatch = description.match(
    /(\d+)\s+(?:residential\s+)?units?/i
  );

  if (unitsMatch) {
    facts.units = Number(unitsMatch[1]);
  }

  const affordableMatch = description.match(
    /(\d+)\s*(?:u|units?)\s+(?:designated\s+as\s+)?affordable/i
  );

  if (affordableMatch) {
    facts.affordableUnits = Number(affordableMatch[1]);
  }

  const storiesMatch = description.match(
    /(\d+)[-\s]story/i
  );

  if (storiesMatch) {
    facts.stories = Number(storiesMatch[1]);
  }

  const parkingMatch = description.match(
    /(\d{1,4}(?:,\d{3})*)\s+(?:parking\s+spaces|parking\s+stalls)/i
  );

  if (parkingMatch) {
    facts.parkingSpaces = Number(
      parkingMatch[1].replace(/,/g, "")
    );
  }

  return facts;
}

function removeLinkLabels(description, links) {
  let result = description;

  for (const link of links) {
    if (link.label.length > 0) {
      result = result.replace(link.label, " ");
    }
  }

  return result.replace(/\s+/g, " ").trim();
}

function extractProjects(html) {
  const projects = [];

  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

  for (const rowMatch of html.matchAll(rowPattern)) {
    const row = rowMatch[1];

    const cells = [];

    for (const cellMatch of row.matchAll(cellPattern)) {
      cells.push(cellMatch[1]);
    }

    if (cells.length < 3) {
      continue;
    }

    const name = cleanText(cells[0]);
    const rawDescription = cells[1];
    const rawStatus = cleanText(cells[2]);

    if (
      !name ||
      !rawDescription ||
      !rawStatus ||
      name.toLowerCase().includes("project name")
    ) {
      continue;
    }

    const links = extractLinks(row);

    const cleanedDescription = cleanText(rawDescription);

    const description = removeLinkLabels(
      cleanedDescription,
      links
    );

    const standardizedStatus = standardizeStatus(rawStatus);

    projects.push({
      id: slugify(name),
      name,
      village: extractVillage(name),
      description,
      rawStatus,
      status: standardizedStatus,
      links,
      facts: extractFacts(description),
      sourceUrl: SOURCE_URL,
      lastSeen: new Date().toISOString(),
    });
  }

  return projects;
}

async function main() {
  console.log("Fetching Newton Development Projects...");

  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "NewtonDevelopmentTracker/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Newton source returned HTTP ${response.status}`
    );
  }

  const html = await response.text();

  console.log("Downloaded Newton page.");
  console.log("Extracting projects...");

  const projects = extractProjects(html);

  if (projects.length === 0) {
    throw new Error(
      "No projects were extracted. The Newton page format may have changed."
    );
  }

  const output = {
    source: SOURCE_URL,
    fetchedAt: new Date().toISOString(),
    projectCount: projects.length,
    projects,
  };

  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify(output, null, 2) + "\n",
    "utf8"
  );

  console.log(
    `Saved ${projects.length} projects to ${OUTPUT_FILE}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});