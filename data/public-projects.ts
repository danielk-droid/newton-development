export type PublicProject = {
  id: string;
  name: string;
  address: string;
  village: string;
  status: "Under Construction" | "Completed";
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

const PUBLIC_BUILDINGS_SOURCE =
  "https://www.newtonma.gov/government/public-buildings/current-upcoming-projects";

export const publicProjects: PublicProject[] = [
  {
    id: "countryside-elementary-school-191-dedham-street",
    name: "Countryside Elementary School, 191 Dedham Street",
    address: "191 Dedham Street",
    village: "Newton Highlands",
    status: "Under Construction",
    type: "Public Building",
    description:
      "Replacement of the existing Countryside Elementary School with a new school building and associated site improvements. The new building is being constructed on the existing school site while the current school remains operational; the existing building will be demolished after the new school is completed.",
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
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City construction document",
        url:
          "https://www.newtonma.gov/home/showpublisheddocument/133291",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: 76000000,
      completionDate: "Summer 2027",
    },
    lastUpdated: "2026-09-03T00:00:00-04:00",
    lastSeen: "2026-09-03T00:00:00-04:00",
  },
  {
    id: "franklin-elementary-school-125-derby-street",
    name: "Franklin Elementary School, 125 Derby Street",
    address: "125 Derby Street",
    village: "West Newton",
    status: "Under Construction",
    type: "Public Building",
    description:
      "Replacement of the existing Franklin Elementary School with a new elementary school and associated site improvements on the same site.",
    rawStatus: "Under construction",
    sourceLabel: "City Franklin School project page",
    sourceUrl:
      "https://www.newtonma.gov/government/public-buildings/capital-projects-investing-now-for-newton-s-future/school-projects/franklin-school-project",
    links: [
      {
        label: "City Franklin School project page",
        url:
          "https://www.newtonma.gov/government/public-buildings/capital-projects-investing-now-for-newton-s-future/school-projects/franklin-school-project",
      },
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City construction procurement record",
        url:
          "https://www.newtonma.gov/home/showpublisheddocument/127759/638779799586970000",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: 71000000,
      completionDate: "Winter 2027",
    },
    lastUpdated: "2026-09-03T00:00:00-04:00",
    lastSeen: "2026-09-03T00:00:00-04:00",
  },
  {
    id: "horace-mann-elementary-school-225-nevada-street",
    name: "Horace Mann Elementary School, 225 Nevada Street",
    address: "225 Nevada Street",
    village: "Newton Centre",
    status: "Under Construction",
    type: "Public Building",
    description:
      "Addition and renovation of Horace Mann Elementary School, including a new addition for cafeteria, classroom, and support space and upgrades to the existing building.",
    rawStatus: "Under construction",
    sourceLabel: "City Horace Mann project page",
    sourceUrl:
      "https://www.newtonma.gov/government/public-buildings/capital-projects-investing-now-for-newton-s-future/school-projects/horace-mann",
    links: [
      {
        label: "City Horace Mann project page",
        url:
          "https://www.newtonma.gov/government/public-buildings/capital-projects-investing-now-for-newton-s-future/school-projects/horace-mann",
      },
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City construction procurement record",
        url:
          "https://www.newtonma.gov/Home/Components/RFP/RFP/1002/",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: 31600000,
      completionDate: "July 2026",
    },
    lastUpdated: "2026-09-03T00:00:00-04:00",
    lastSeen: "2026-09-03T00:00:00-04:00",
  },
  {
    id: "lincoln-eliot-elementary-school-150-jackson-road",
    name: "Lincoln-Eliot Elementary School, 150 Jackson Road",
    address: "150 Jackson Road",
    village: "Nonantum",
    status: "Completed",
    type: "Public Building",
    description:
      "New home for the Lincoln-Eliot Elementary School at 150 Jackson Road, replacing the school's former location. Students began the 2025-2026 school year in the new building.",
    rawStatus: "Completed",
    sourceLabel: "City Public Buildings information",
    sourceUrl:
      "https://www.newtonma.gov/government/public-buildings",
    links: [
      {
        label: "City Public Buildings page",
        url: "https://www.newtonma.gov/government/public-buildings",
      },
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: 53000000,
      completionDate: "September 2025",
    },
    lastUpdated: "2026-09-03T00:00:00-04:00",
    lastSeen: "2026-09-03T00:00:00-04:00",
  },
];
