export type ProjectEventType =
  | "Hearing"
  | "Meeting"
  | "Decision"
  | "Application"
  | "Notice"
  | "Construction"
  | "Other";

export type ProjectEvent = {
  id: string;
  projectId: string;
  date: string;
  title: string;
  description: string;
  type: ProjectEventType;
  sourceUrl: string;
  participationUrl?: string;
  verified: true;
};

export const projectEvents: ProjectEvent[] = [
  {
    id: "38-crafts-zba-feb-24-2026",
    projectId: "38-crafts-street-newtonville",
    date: "2026-02-24",
    title: "Zoning Board of Appeals hearing",
    description:
      "The Zoning Board of Appeals held a public hearing on the comprehensive permit application for the 234-unit development.",
    type: "Hearing",
    sourceUrl:
      "https://www.newtonma.gov/home/showpublisheddocument/137129/639096104185000000",
    participationUrl:
      "https://www.newtonma.gov/government/planning/zoning-board-of-appeals",
    verified: true,
  },
  {
    id: "38-crafts-zba-apr-29-2026",
    projectId: "38-crafts-street-newtonville",
    date: "2026-04-29",
    title: "Zoning Board of Appeals hearing",
    description:
      "A Zoning Board of Appeals hearing was scheduled for the comprehensive permit application.",
    type: "Hearing",
    sourceUrl:
      "https://www.newtonma.gov/home/showpublisheddocument/137599",
    participationUrl:
      "https://www.newtonma.gov/government/planning/zoning-board-of-appeals",
    verified: true,
  },
  {
    id: "38-crafts-zba-may-27-2026",
    projectId: "38-crafts-street-newtonville",
    date: "2026-05-27",
    title: "Zoning Board of Appeals hearing",
    description:
      "The Zoning Board of Appeals agenda included the comprehensive permit application for the 234-unit development with 59 affordable units and 290 parking spaces.",
    type: "Hearing",
    sourceUrl:
      "https://www.newtonma.gov/home/showpublisheddocument/139020/639149789559770000",
    participationUrl:
      "https://www.newtonma.gov/government/planning/zoning-board-of-appeals",
    verified: true,
  },
];