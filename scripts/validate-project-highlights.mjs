import { readFile } from "node:fs/promises";

const source = await readFile("data/project-highlights.ts", "utf8");

const objectBlocks = [...source.matchAll(/\{[^{}]*\}/g)].map((match) => match[0]);

if (objectBlocks.length === 0) {
  throw new Error("No project highlights were found.");
}

const sourceUrls = new Set();

for (const [index, block] of objectBlocks.entries()) {
  const label = block.match(/\blabel:\s*"([^"]*)"/)?.[1];
  const value = block.match(/\bvalue:\s*"([^"]*)"/)?.[1];
  const sourceUrl = block.match(/\bsourceUrl:\s*"([^"]*)"/)?.[1];

  if (!label?.trim()) {
    throw new Error(`Highlight ${index + 1} is missing label.`);
  }
  if (!value?.trim()) {
    throw new Error(`Highlight ${index + 1} is missing value.`);
  }
  if (!sourceUrl?.trim()) {
    throw new Error(`Highlight ${index + 1} is missing source URL.`);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    throw new Error(`Highlight ${index + 1} has an invalid source URL: ${sourceUrl}`);
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error(`Highlight ${index + 1} source URL must use HTTPS: ${sourceUrl}`);
  }

  sourceUrls.add(sourceUrl);
}

console.log(`Validated ${objectBlocks.length} verified project highlights across ${sourceUrls.size} source pages.`);
