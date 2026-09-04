import fs from "node:fs";
import path from "node:path";

const roots = ["app", "data", "README.md"];
const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".html"]);

const prohibitedPatterns = [
  /not\s+manually\s+estimated/gi,
  /not\s+randomly\s+guessed/gi,
  /not\s+just\s+guessed/gi,
  /not\s+made\s+up/gi,
  /not\s+invented/gi,
  /not\s+guessed/gi,
  /not\s+simply\s+guessed/gi,
  /not\s+just\s+estimated/gi,
];

function filesUnder(root) {
  const absolute = path.resolve(root);
  if (!fs.existsSync(absolute)) return [];

  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [absolute];

  const results = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
    results.push(...filesUnder(path.join(absolute, entry.name)));
  }
  return results;
}

const files = roots.flatMap(filesUnder).filter((file) => extensions.has(path.extname(file)));
const violations = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of prohibitedPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      violations.push(path.relative(process.cwd(), file));
    }
  }
}

if (violations.length > 0) {
  console.error("Unprofessional defensive provenance wording found in:");
  for (const file of [...new Set(violations)]) console.error(`- ${file}`);
  console.error("Use direct source/provenance language instead, such as stating the official source or describing how data is collected.");
  process.exit(1);
}

console.log(`Copy validation passed across ${files.length} source/content files.`);
