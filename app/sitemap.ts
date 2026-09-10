import type { MetadataRoute } from "next";
import { allProjects } from "../data/project-catalog";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://newton-development.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/projects`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/map`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ...allProjects.map((project) => ({
      url: `${siteUrl}/projects/${project.id}`,
      lastModified: new Date(project.lastUpdated),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
