import { readFile } from "node:fs/promises";

const source = await readFile("data/project-highlights.ts", "utf8");

const requiredFields = ["label", "value", "sourceUrl"];
const objectBlocks = source.match(/\{\s*label:[\s\S]*?sourceUrl:[\s\S]*?\n\s*\}/g) ?? [];

if (objectBlocks.length === 0) {
  throw new Error("No project highlights were found.");
}

const sourceUrls = new Set();

for (const [index, block] of objectBlocks.entries()) {
  for (const field of requiredFields) {
    if (!new RegExp(`\\b${field}\\s*:`).test(block)) {
      throw new Error(`Highlight ${index + 1} is missing ${field}.`);
    }
  }

  const sourceUrl = block.match(/sourceUrl:\s*["']([^"']+)["']/)?.[1];
  if (!sourceUrl || !/^https:\/\//.test(sourceUrl)) {
    throw new Error(`Highlight ${index + 1} has an invalid source URL.`);
  }
  sourceUrls.add(sourceUrl);

  const label = block.match(/label:\s*["']([^"']+)["']/)?.[1];
  const value = block.match(/value:\s*["']([^"']+)["']/)?.[1];
  if (!label?.trim() || !value?.trim()) {
    throw new Error(`Highlight ${index + 1} has an empty label or value.`);
  }
}

for (const url of sourceUrls) {
  const response = await fetch(url, { method: "GET", redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Highlight source returned ${response.status}: ${url}`);
  }
  console.log(`Source reachable (${response.status}): ${url}`);
}

console.log(`Validated ${objectBlocks.length} verified project highlights across ${sourceUrls.size} source pages.`);
