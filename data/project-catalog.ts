import sourceData from "./newton-source.json";
import { projects, type Project } from "./projects";
import { publicProjects } from "./public-projects";

export type CatalogProject = Project & {
  rawStatus: string;
  links: {
    label: string;
    url: string;
  }[];
  estimatedCost: number | null;
  completionDate: string | null;
};

export const allProjects: CatalogProject[] = [
  ...projects.map((project) => {
    const sourceProject = sourceData.projects.find(
      (item) => item.id === project.id
    );

    return {
      ...project,
      rawStatus: sourceProject?.rawStatus ?? project.status,
      links: sourceProject?.links ?? [],
      estimatedCost: null,
      completionDate: null,
    };
  }),
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
    rawStatus: project.rawStatus,
    links: project.links,
    estimatedCost: project.facts.estimatedCost,
    completionDate: project.facts.completionDate,
  })),
];
