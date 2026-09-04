export type PublicProject = {
  id: string;
  name: string;
  address: string;
  village: string;
  status: "Under Construction";
  type: "Public Building";
  description: string;
  rawStatus: string;
  sourceLabel: string;
  sourceUrl: string;
  links: {
    label: string;
    url: string;
  }[];
  facts: {
    units: number | null;
    affordableUnits: number | null;
    stories: number | null;
    parkingSpaces: number | null;
    estimatedCost: number | null;
    completionDate: string | null;
  };
  lastUpdated: string;
  lastSeen: string;
};

export const publicProjects: PublicProject[] = [
  {
    id: "countryside-elementary-school-191-dedham-street",
    name: "Countryside Elementary School, 191 Dedham Street",
    address: "191 Dedham Street",
    village: "Newton Highlands",
    status: "Under Construction",
    type: "Public Building",
    description:
      "Replacement of the existing Countryside Elementary School with a new three-story school building and associated site improvements. The new building is being constructed on the existing school site while the current school remains operational; the existing building will be demolished after the new school is completed.",
    rawStatus: "Under construction",
    sourceLabel: "City Countryside project page",
    sourceUrl:
      "https://www.newtonma.gov/government/public-buildings/capital-projects-investing-now-for-newton-s-future/school-projects/countryside",
    links: [
      {
        label: "City Countryside project page",
        url:
          "https://www.newtonma.gov/government/public-buildings/capital-projects-investing-now-for-newton-s-future/school-projects/countryside",
      },
      {
        label: "City construction procurement record",
        url:
          "https://www.newtonma.gov/Home/Components/RFP/RFP/984/",
      },
      {
        label: "City project document",
        url:
          "https://www.newtonma.gov/home/showpublisheddocument/118269/638473114208770000",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: 3,
      parkingSpaces: null,
      estimatedCost: 60000000,
      completionDate: "December 2026",
    },
    lastUpdated: "2026-09-03T00:00:00-04:00",
    lastSeen: "2026-09-03T00:00:00-04:00",
  },
];
