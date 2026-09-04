import sourceData from "./newton-source.json";
import { projects, type Project } from "./projects";
import { publicProjects } from "./public-projects";
import { transportationProjects } from "./transportation-projects";

type ProjectFacts = {
  units: number | null;
  affordableUnits: number | null;
  stories: number | null;
  parkingSpaces: number | null;
};

export type CatalogProject = Project & {
  rawStatus: string;
  links: {
    label: string;
    url: string;
  }[];
  facts: ProjectFacts;
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
      facts: sourceProject?.facts ?? {
        units: null,
        affordableUnits: null,
        stories: null,
        parkingSpaces: null,
      },
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
    facts: {
      units: project.facts.units,
      affordableUnits: project.facts.affordableUnits,
      stories: project.facts.stories,
      parkingSpaces: project.facts.parkingSpaces,
    },
    estimatedCost: project.facts.estimatedCost,
    completionDate: project.facts.completionDate,
  })),
  ...transportationProjects.map((project) => ({
    ...project,
    facts: {
      units: project.facts.units,
      affordableUnits: project.facts.affordableUnits,
      stories: project.facts.stories,
      parkingSpaces: project.facts.parkingSpaces,
    },
  })),
];
