import { projects, type Project } from "./projects";
import { publicProjects } from "./public-projects";

export type CatalogProject = Project & {
  estimatedCost: number | null;
  completionDate: string | null;
};

export const allProjects: CatalogProject[] = [
  ...projects.map((project) => ({
    ...project,
    estimatedCost: null,
    completionDate: null,
  })),
  ...publicProjects.map((project) => ({
    id: project.id,
    name: project.name,
    address: project.address,
    village: project.village,
    status: project.status,
    type: project.type,
    description: project.description,
    lastUpdated: project.lastUpdated,
    sourceUrl: project.sourceUrl,
    history: [],
    estimatedCost: project.facts.estimatedCost,
    completionDate: project.facts.completionDate,
  })),
];
