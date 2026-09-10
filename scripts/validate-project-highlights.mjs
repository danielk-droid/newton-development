import { readFile } from "node:fs/promises";

const source = await readFile("data/project-highlights.ts", "utf8");

// Match only complete highlight object literals. This intentionally ignores the
// TypeScript type declaration and the outer projectHighlights object.
const highlights = [...source.matchAll(
  /\{\s*label:\s*"([^"]*)",\s*value:\s*"([^"]*)",\s*sourceUrl:\s*"([^"]*)"\s*\}/g,
)].map((match) => ({
  label: match[1],
  value: match[2],
  sourceUrl: match[3],
}));

if (highlights.length === 0) {
  throw new Error("No project highlights were found.");
}

const sourceUrls = new Set();

for (const [index, highlight] of highlights.entries()) {
  const { label, value, sourceUrl } = highlight;

  if (!label.trim()) {
    throw new Error(`Highlight ${index + 1} is missing label.`);
  }
  if (!value.trim()) {
    throw new Error(`Highlight ${index + 1} is missing value.`);
  }
  if (!sourceUrl.trim()) {
    throw new Error(`Highlight ${index + 1} is missing source URL.`);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    throw new Error(`Highlight ${index + 1} has an invalid source URL: ${sourceUrl}`);
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error(`Highlight ${index + 1} has an invalid source URL: ${sourceUrl}`);
  }

  sourceUrls.add(sourceUrl);
}

console.log(`Validated ${highlights.length} verified project highlights across ${sourceUrls.size} source pages.`);
