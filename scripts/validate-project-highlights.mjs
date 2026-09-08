import { readFile } from "node:fs/promises";

const source = await readFile("data/project-highlights.ts", "utf8");

const requiredFields = ["label", "value", "sourceUrl"];
const objectBlocks = [...source.matchAll(/\{\s*label:\s*"([^"]+)"\s*,\s*value:\s*"([^"]+)"\s*,\s*sourceUrl:\s*"([^"]+)"\s*\}/g)].map((match) => ({
  label: match[1],
  value: match[2],
  sourceUrl: match[3],
}));

if (objectBlocks.length === 0) {
  throw new Error("No project highlights were found.");
}

const sourceUrls = new Set();

for (const [index, highlight] of objectBlocks.entries()) {
  for (const field of requiredFields) {
    if (!highlight[field]?.trim()) {
      throw new Error(`Highlight ${index + 1} is missing ${field}.`);
    }
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(highlight.sourceUrl);
  } catch {
    throw new Error(`Highlight ${index + 1} has an invalid source URL.`);
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error(`Highlight ${index + 1} source URL must use HTTPS.`);
  }

  sourceUrls.add(highlight.sourceUrl);
}

console.log(`Validated ${objectBlocks.length} verified project highlights across ${sourceUrls.size} source pages.`);
