import fs from "node:fs";
import path from "node:path";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

export type ProjectImage = {
  src: string;
  alt: string;
  priority?: boolean;
};

function humanizeFilename(filename: string, projectName: string) {
  const withoutExtension = filename.replace(/\.[^.]+$/, "");
  if (/^hero$/i.test(withoutExtension)) return `${projectName} project image`;
  return `${projectName} — ${withoutExtension.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}`;
}

/**
 * Automatically discovers project images from public/projects/<project-id>/.
 * No project-specific image manifest is required.
 *
 * Recommended filenames:
 *   hero.jpg   -> first/featured image
 *   01.jpg
 *   02.jpg
 *   03.jpg
 *
 * Images are sorted with hero first, then naturally by filename.
 */
export function getProjectImages(projectId: string, projectName: string): ProjectImage[] {
  const directory = path.join(process.cwd(), "public", "projects", projectId);

  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => {
      const aHero = /^hero\./i.test(a);
      const bHero = /^hero\./i.test(b);
      if (aHero !== bHero) return aHero ? -1 : 1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    })
    .map((filename, index) => ({
      src: `/projects/${projectId}/${encodeURIComponent(filename)}`,
      alt: humanizeFilename(filename, projectName),
      priority: index === 0,
    }));
}
