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

function extractLinks(row) {
  const links = [];

  const pattern =
    /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of row.matchAll(pattern)) {
    const href = match[1];
    const label = cleanText(match[2]);

    if (!href || !label) {
      continue;
    }

    const url = href.startsWith("http")
      ? href
      : new URL(href, SOURCE_URL).href;

    links.push({
      label,
      url,
    });
  }

  return links;
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
    const rawStatus = cells[2];

    const description = cleanText(rawDescription);
    const status = cleanText(rawStatus);

    if (
      !name ||
      !description ||
      !status ||
      name.toLowerCase().includes("project name")
    ) {
      continue;
    }

    const links = extractLinks(row);

    projects.push({
      id: slugify(name),
      name,
      description,
      status,
      links,
      sourceUrl: SOURCE_URL,
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

  console.log(`Saved ${projects.length} projects to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});