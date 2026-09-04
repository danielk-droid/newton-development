export type PublicProject = {
  id: string;
  name: string;
  address: string;
  village: string;
  status: "Under Construction" | "Completed" | "Approved" | "Submitted";
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

const PUBLIC_BUILDINGS_PAGE =
  "https://www.newtonma.gov/government/public-buildings";

const UPDATED_AT = "2026-09-03T00:00:00-04:00";

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
        url: "https://www.newtonma.gov/home/showpublisheddocument/133291",
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
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
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
          "https://www.newtonma.gov/government/public-buildings/capital-projects-investing-now-for-newton-s-future/school-project-project",
      },
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City construction procurement document",
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
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
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
        url: "https://www.newtonma.gov/Home/Components/RFP/RFP/1002/",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: 33000000,
      completionDate: "September 2026",
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
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
    sourceUrl: PUBLIC_BUILDINGS_PAGE,
    links: [
      {
        label: "City Public Buildings page",
        url: PUBLIC_BUILDINGS_PAGE,
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
      estimatedCost: 51800000,
      completionDate: "September 2025",
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "newton-south-high-school-redevelopment",
    name: "Newton South High School Redevelopment",
    address: "140 Brandeis Road",
    village: "Newton Centre",
    status: "Submitted",
    type: "Public Building",
    description:
      "Feasibility and redevelopment planning for Newton South High School. The City is advancing designer-selection work to study the scope and future rehabilitation or redevelopment needs of the school.",
    rawStatus: "Feasibility / designer selection",
    sourceLabel: "City Newton South redevelopment procurement",
    sourceUrl:
      "https://www.newtonma.gov/Home/Components/RFP/RFP/1254/669",
    links: [
      {
        label: "City Newton South designer-services procurement",
        url:
          "https://www.newtonma.gov/Home/Components/RFP/RFP/1254/669",
      },
      {
        label: "City Public Buildings page",
        url: PUBLIC_BUILDINGS_PAGE,
      },
      {
        label: "City FY2027-FY2031 CIP",
        url:
          "https://www.newtonma.gov/home/showpublisheddocument/138092/639129159798330000",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: null,
      completionDate: null,
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "underwood-school-redevelopment",
    name: "Underwood School Redevelopment",
    address: "101 Vernon Street",
    village: "Newton Corner",
    status: "Submitted",
    type: "Public Building",
    description:
      "Feasibility and redevelopment planning for Underwood Elementary School as part of the City's Ward/Underwood school facilities study. The City is evaluating whether the schools should be addressed separately or through a combined project.",
    rawStatus: "Feasibility / designer selection",
    sourceLabel: "City Underwood/Ward redevelopment procurement",
    sourceUrl:
      "https://www.newtonma.gov/Home/Components/RFP/RFP/1250/669",
    links: [
      {
        label: "City Underwood/Ward designer-services procurement",
        url:
          "https://www.newtonma.gov/Home/Components/RFP/RFP/1250/669",
      },
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City FY2027-FY2031 CIP",
        url:
          "https://www.newtonma.gov/home/showpublisheddocument/138092/639129159798330000",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: null,
      completionDate: null,
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "ward-school-redevelopment",
    name: "Ward School Redevelopment",
    address: "225 Cherry Street",
    village: "West Newton",
    status: "Submitted",
    type: "Public Building",
    description:
      "Feasibility and redevelopment planning for Ward Elementary School as part of the City's Ward/Underwood school facilities study. The City is evaluating whether the schools should be addressed separately or through a combined project.",
    rawStatus: "Feasibility / designer selection",
    sourceLabel: "City Underwood/Ward redevelopment procurement",
    sourceUrl:
      "https://www.newtonma.gov/Home/Components/RFP/RFP/1250/669",
    links: [
      {
        label: "City Underwood/Ward designer-services procurement",
        url:
          "https://www.newtonma.gov/Home/Components/RFP/RFP/1250/669",
      },
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City FY2027-FY2031 CIP",
        url:
          "https://www.newtonma.gov/home/showpublisheddocument/138092/639129159798330000",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: null,
      completionDate: null,
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "cooper-center-for-active-living",
    name: "Cooper Center for Active Living",
    address: "345 Walnut Street",
    village: "Newtonville",
    status: "Completed",
    type: "Public Building",
    description:
      "New 33,000-square-foot community and older-adult center replacing the former facility. The Cooper Center includes multipurpose space, a gymnasium, fitness and arts rooms, meeting space, a library, lounge areas, and a café.",
    rawStatus: "Completed / opened December 2025",
    sourceLabel: "City Cooper Center for Active Living project page",
    sourceUrl:
      "https://www.newtonma.gov/government/public-buildings/capital-projects-investing-now-for-newton-s-future/municipal-facilities-projects/newton-center-for-active-living",
    links: [
      {
        label: "City Cooper Center project page",
        url:
          "https://www.newtonma.gov/government/public-buildings/capital-projects-investing-now-for-newton-s-future/municipal-facilities-projects/newton-center-for-active-living",
      },
      {
        label: "Cooper project updates",
        url: "https://cooper.projects.nv5.com/",
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
      estimatedCost: 30500000,
      completionDate: "December 2025",
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "gath-memorial-pool-renovation",
    name: "Gath Memorial Pool Renovation",
    address: "256 Albemarle Road",
    village: "Newtonville",
    status: "Completed",
    type: "Public Building",
    description:
      "Major renovation and reconstruction of Gath Memorial Pool, including a competition pool, zero-entry recreational pool, splash pads, and improvements to bathhouse accessibility and functionality.",
    rawStatus: "Completed",
    sourceLabel: "City Gath Pool renovation project",
    sourceUrl:
      "https://www.newtonma.gov/government/parks-recreation-culture/aquatics/gath-memorial-pool-renovation-project",
    links: [
      {
        label: "City Gath Pool renovation project",
        url:
          "https://www.newtonma.gov/government/parks-recreation-culture/aquatics/gath-memorial-pool-renovation-project",
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
      estimatedCost: 6379862,
      completionDate: "June 2024",
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "new-police-headquarters-and-training-facility",
    name: "New Police Headquarters and Training Facility",
    address: "Newton, MA",
    village: "Unknown",
    status: "Submitted",
    type: "Public Building",
    description:
      "Feasibility and planning project for a new Newton Police Headquarters and Training Facility. The City approved funding in 2026 for the feasibility design phase; the project remains at the feasibility stage and no construction cost has been established.",
    rawStatus: "Feasibility design phase",
    sourceLabel: "City FY2027-FY2031 Capital Improvement Plan",
    sourceUrl:
      "https://www.newtonma.gov/home/showpublisheddocument/138092/639129159798330000",
    links: [
      {
        label: "City FY2027-FY2031 CIP",
        url:
          "https://www.newtonma.gov/home/showpublisheddocument/138092/639129159798330000",
      },
      {
        label: "City Public Buildings page",
        url: PUBLIC_BUILDINGS_PAGE,
      },
      {
        label: "City Public Facilities Committee report",
        url:
          "https://www.newtonma.gov/home/showpublisheddocument/138806/639144565619030000",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: null,
      completionDate: null,
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "pellegrini-park-field-house",
    name: "Pellegrini Park Field House",
    address: "Pellegrini Park",
    village: "Unknown",
    status: "Submitted",
    type: "Public Building",
    description:
      "Municipal park facility project listed by the City as a Public Buildings capital project.",
    rawStatus: "Capital project",
    sourceLabel: "City Public Buildings project list",
    sourceUrl: PUBLIC_BUILDINGS_SOURCE,
    links: [
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City Public Buildings page",
        url: PUBLIC_BUILDINGS_PAGE,
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: null,
      completionDate: null,
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "police-department-facilities-improvements",
    name: "Police Department Facilities Improvements",
    address: "Newton, MA",
    village: "Unknown",
    status: "Submitted",
    type: "Public Building",
    description:
      "Municipal police-facility improvement program listed by the City among its Public Buildings capital projects. This is separate from the proposed new Police Headquarters and Training Facility.",
    rawStatus: "Capital project",
    sourceLabel: "City Public Buildings project list",
    sourceUrl: PUBLIC_BUILDINGS_SOURCE,
    links: [
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City Public Buildings page",
        url: PUBLIC_BUILDINGS_PAGE,
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: null,
      completionDate: null,
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "splash-park",
    name: "Splash Park",
    address: "Newton, MA",
    village: "Unknown",
    status: "Submitted",
    type: "Public Building",
    description:
      "Municipal recreational facility project listed by the City among its Public Buildings capital projects.",
    rawStatus: "Capital project",
    sourceLabel: "City Public Buildings project list",
    sourceUrl: PUBLIC_BUILDINGS_SOURCE,
    links: [
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City Public Buildings page",
        url: PUBLIC_BUILDINGS_PAGE,
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: null,
      completionDate: null,
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "police-headquarters-parking-lot-security-improvement",
    name: "Police Headquarters Parking Lot Security Improvement",
    address: "Newton, MA",
    village: "Unknown",
    status: "Submitted",
    type: "Public Building",
    description:
      "Security improvement project at the Newton Police Headquarters parking lot, listed by the City as a municipal Public Buildings project.",
    rawStatus: "Capital project",
    sourceLabel: "City Public Buildings project list",
    sourceUrl: PUBLIC_BUILDINGS_SOURCE,
    links: [
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City Public Buildings page",
        url: PUBLIC_BUILDINGS_PAGE,
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: null,
      completionDate: null,
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "crafts-street-wash-bay",
    name: "Crafts Street Wash Bay",
    address: "Crafts Street",
    village: "Unknown",
    status: "Submitted",
    type: "Public Building",
    description:
      "Municipal Public Works wash-bay project listed by the City among its Public Buildings capital projects.",
    rawStatus: "Capital project",
    sourceLabel: "City Public Buildings project list",
    sourceUrl: PUBLIC_BUILDINGS_SOURCE,
    links: [
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City Public Buildings page",
        url: PUBLIC_BUILDINGS_PAGE,
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: null,
      completionDate: null,
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "necp-school-project",
    name: "NECP School Project",
    address: "Newton, MA",
    village: "Unknown",
    status: "Submitted",
    type: "Public Building",
    description:
      "Newton Early Childhood Program facility project listed by the City among its school capital projects.",
    rawStatus: "Capital project",
    sourceLabel: "City Public Buildings project list",
    sourceUrl: PUBLIC_BUILDINGS_SOURCE,
    links: [
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City Public Buildings page",
        url: PUBLIC_BUILDINGS_PAGE,
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: null,
      completionDate: null,
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "oak-hill-school-project",
    name: "Oak Hill School Project",
    address: "Newton, MA",
    village: "Unknown",
    status: "Submitted",
    type: "Public Building",
    description:
      "Oak Hill School capital project listed by the City among its school projects.",
    rawStatus: "Capital project",
    sourceLabel: "City Public Buildings project list",
    sourceUrl: PUBLIC_BUILDINGS_SOURCE,
    links: [
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City Public Buildings page",
        url: PUBLIC_BUILDINGS_PAGE,
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: null,
      completionDate: null,
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "nnhs-field-lights",
    name: "Newton North High School Field Lights",
    address: "360 Lowell Avenue",
    village: "Nonantum",
    status: "Completed",
    type: "Public Building",
    description:
      "Newton North High School stadium field-lighting project listed by the City as a completed school-related capital project.",
    rawStatus: "Completed",
    sourceLabel: "City Public Buildings project list",
    sourceUrl: PUBLIC_BUILDINGS_SOURCE,
    links: [
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City Public Buildings page",
        url: PUBLIC_BUILDINGS_PAGE,
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: null,
      completionDate: null,
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },

  {
    id: "peirce-school-heating-system-improvements",
    name: "Peirce School Heating System Improvements",
    address: "170 Jackson Road",
    village: "West Newton",
    status: "Submitted",
    type: "Public Building",
    description:
      "Heating-system improvement project at Peirce School listed by the City among its school capital projects.",
    rawStatus: "Capital project",
    sourceLabel: "City Public Buildings project list",
    sourceUrl: PUBLIC_BUILDINGS_SOURCE,
    links: [
      {
        label: "City Public Buildings project list",
        url: PUBLIC_BUILDINGS_SOURCE,
      },
      {
        label: "City Public Buildings page",
        url: PUBLIC_BUILDINGS_PAGE,
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
      estimatedCost: null,
      completionDate: null,
    },
    lastUpdated: UPDATED_AT,
    lastSeen: UPDATED_AT,
  },
];
