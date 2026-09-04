import { projects, type Project } from "./projects";
import { publicProjects } from "./public-projects";

export const allProjects: Project[] = [
  ...projects,
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
  })),
];
