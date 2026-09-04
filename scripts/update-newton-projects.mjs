import fs from "node:fs/promises";

const SOURCE_URL =
  "https://www.newtonma.gov/government/planning/development-projects";

const OUTPUT_FILE = "data/newton-source.json";

const USER_AGENT = "NewtonDevelopment/1.0";

const VILLAGES = [
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
  return decodeHtml(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeProjectName(name) {
  const cleaned = cleanText(name);

  if (cleaned.toLowerCase() === "38 crafts streets, newtonville") {
    return "38 Crafts Street, Newtonville";
  }

  return cleaned;
}

function slugify(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractLinks(html) {
  const links = [];

  const pattern =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(pattern)) {
    const href = decodeHtml(match[1]);
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
  const lower = cleanText(name).toLowerCase();

  return (
    VILLAGES.find((village) =>
      lower.includes(village.toLowerCase())
    ) ?? "Unknown"
  );
}

function extractAddress(name) {
  const cleaned = cleanText(name);
  const commaIndex = cleaned.indexOf(",");

  if (commaIndex === -1) {
    return cleaned;
  }

  return cleaned.slice(0, commaIndex).trim();
}

function standardizeStatus(rawStatus) {
  const status = cleanText(rawStatus).toLowerCase();

  if (status.includes("under construction")) {
    return "Under Construction";
  }

  if (status.includes("complete")) {
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

  if (
    status.includes("scheduled") ||
    status.includes("hearing")
  ) {
    return "Scheduled for Hearing";
  }

  if (
    status.includes("filed") ||
    status.includes("submitted")
  ) {
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
  const text = cleanText(description);

  let units = null;
  let affordableUnits = null;
  let stories = null;
  let parkingSpaces = null;

  const unitMatches = [
    ...text.matchAll(
      /\b(\d[\d,]*)\s+(?:residential\s+)?units?\b/gi
    ),
  ];

  if (unitMatches.length > 0) {
    units = Math.max(
      ...unitMatches.map((match) =>
        Number(match[1].replace(/,/g, ""))
      )
    );
  }

  const affordablePatterns = [
    /\b(\d[\d,]*)\s+affordable\s+units?\b/i,
    /\b(\d[\d,]*)\s+units?\s+designated\s+as\s+affordable\b/i,
    /\b(\d[\d,]*)\s+units?\s+.*?affordable\b/i,
  ];

  for (const pattern of affordablePatterns) {
    const match = text.match(pattern);

    if (match) {
      affordableUnits = Number(
        match[1].replace(/,/g, "")
      );
      break;
    }
  }

  const storiesMatch = text.match(
    /\b(\d+)[-\s]?stor(?:y|ies)\b/i
  );

  if (storiesMatch) {
    stories = Number(storiesMatch[1]);
  }

  const numberWordStories = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
  };

  if (stories === null) {
    const wordStoryMatch = text.match(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)[-\s]?stor(?:y|ies)\b/i
    );

    if (wordStoryMatch) {
      stories =
        numberWordStories[
          wordStoryMatch[1].toLowerCase()
        ];
    }
  }

  const parkingMatch = text.match(
    /\b(\d[\d,]*)\s+parking\s+(?:spaces?|stalls?)\b/i
  );

  if (parkingMatch) {
    parkingSpaces = Number(
      parkingMatch[1].replace(/,/g, "")
    );
  }

  return {
    units,
    affordableUnits,
    stories,
    parkingSpaces,
  };
}

function removeLinkLabels(description, links) {
  let result = description;

  for (const link of links) {
    if (link.label) {
      result = result.replace(link.label, " ");
    }
  }

  return result.replace(/\s+/g, " ").trim();
}

function extractProjects(html, fetchedAt) {
  const projects = [];

  const rowPattern =
    /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;

  const cellPattern =
    /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;

  for (const rowMatch of html.matchAll(rowPattern)) {
    const row = rowMatch[1];

    const cells = [];

    for (const cellMatch of row.matchAll(cellPattern)) {
      cells.push(cellMatch[1]);
    }

    if (cells.length < 3) {
      continue;
    }

    const name = normalizeProjectName(cells[0]);
    const rawDescription = cells[1];
    const rawStatus = cleanText(cells[2]);

    if (!name || !rawDescription || !rawStatus) {
      continue;
    }

    if (
      name.toLowerCase().includes("project name")
    ) {
      continue;
    }

    const links = extractLinks(row);

    const cleanedDescription =
      cleanText(rawDescription);

    const description = removeLinkLabels(
      cleanedDescription,
      links
    );

    projects.push({
      id: slugify(name),
      slug: slugify(name),
      name,
      address: extractAddress(name),
      village: extractVillage(name),
      status: standardizeStatus(rawStatus),
      rawStatus,
      type: "Development Project",
      description,
      facts: extractFacts(description),
      lastUpdated: fetchedAt,
      sourceUrl: SOURCE_URL,
      links,
      location: {
        latitude: null,
        longitude: null,
        source: null,
      },
      lastSeen: fetchedAt,
    });
  }

  const uniqueProjects = new Map();

  for (const project of projects) {
    uniqueProjects.set(project.id, project);
  }

  return [...uniqueProjects.values()];
}

async function readPreviousData() {
  try {
    const file = await fs.readFile(
      OUTPUT_FILE,
      "utf8"
    );

    return JSON.parse(file);
  } catch {
    return null;
  }
}

function getVerifiedHistory(previousProject) {
  if (!Array.isArray(previousProject?.history)) {
    return [];
  }

  return previousProject.history.filter(
    (event) =>
      event &&
      event.verified === true &&
      typeof event.date === "string" &&
      typeof event.title === "string" &&
      typeof event.sourceUrl === "string"
  );
}

function preserveVerifiedHistory(
  projects,
  previousData
) {
  const previousProjects = new Map(
    (previousData?.projects ?? []).map((project) => [
      project.id ?? project.slug,
      project,
    ])
  );

  return projects.map((project) => {
    const previous = previousProjects.get(project.id);

    return {
      ...project,
      history: getVerifiedHistory(previous),
    };
  });
}

function preserveExistingLocation(
  projects,
  previousData
) {
  const previousProjects = new Map(
    (previousData?.projects ?? []).map((project) => [
      project.id ?? project.slug,
      project,
    ])
  );

  return projects.map((project) => {
    const previous = previousProjects.get(project.id);

    if (
      previous?.location?.latitude != null &&
      previous?.location?.longitude != null
    ) {
      return {
        ...project,
        location: previous.location,
      };
    }

    return project;
  });
}

function detectStatusChanges(
  projects,
  previousData
) {
  const previousProjects = new Map(
    (previousData?.projects ?? []).map((project) => [
      project.id ?? project.slug,
      project,
    ])
  );

  let statusChanges = 0;

  for (const project of projects) {
    const previous = previousProjects.get(project.id);

    if (
      previous &&
      previous.status !== project.status
    ) {
      statusChanges++;

      console.log(
        `Status change observed: ${project.name}: ${previous.status} -> ${project.status}`
      );

      console.log(
        "  Observation date is not being recorded as a historical event date."
      );
    }
  }

  return statusChanges;
}

async function main() {
  console.log(
    "Fetching Newton Development Projects..."
  );

  const fetchedAt = new Date().toISOString();

  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": USER_AGENT,
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

  let projects = extractProjects(
    html,
    fetchedAt
  );

  if (projects.length === 0) {
    throw new Error(
      "No projects were extracted. The Newton page format may have changed."
    );
  }

  console.log(
    `Extracted ${projects.length} projects.`
  );

  const previousData = await readPreviousData();

  projects = preserveExistingLocation(
    projects,
    previousData
  );

  projects = preserveVerifiedHistory(
    projects,
    previousData
  );

  const statusChanges = detectStatusChanges(
    projects,
    previousData
  );

  const output = {
    source: SOURCE_URL,
    fetchedAt,
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

  console.log(
    `Detected ${statusChanges} status changes.`
  );

  console.log(
    "Historical timeline entries were preserved only when explicitly verified."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});