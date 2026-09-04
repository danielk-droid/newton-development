import type { Project } from "./projects";

const UPDATED_AT = "2026-09-03T00:00:00-04:00";

export type TransportationProject = Project & {
  rawStatus: string;
  links: {
    label: string;
    url: string;
  }[];
  facts: {
    units: null;
    affordableUnits: null;
    stories: null;
    parkingSpaces: null;
  };
  estimatedCost: number | null;
  completionDate: string | null;
};

export const transportationProjects: TransportationProject[] = [
  {
    id: "transportation-network-improvement-program",
    name: "Transportation Network Improvement Program",
    address: "Citywide",
    village: "Unknown",
    status: "Under Construction",
    type: "Transportation",
    description:
      "Citywide program for paving and maintaining roadways, sidewalks, ADA ramps, traffic calming, bicycle accommodations, pavement markings, and related accessibility improvements. The FY2027-FY2031 capital plan provides $9.5 million annually for the program.",
    lastUpdated: UPDATED_AT,
    sourceUrl:
      "https://www.newtonma.gov/government/public-works/construction-projects",
    history: [],
    rawStatus: "Ongoing citywide capital program",
    links: [
      {
        label: "City Public Works construction projects",
        url: "https://www.newtonma.gov/government/public-works/construction-projects",
      },
      {
        label: "City FY2027-FY2031 CIP",
        url: "https://www.newtonma.gov/home/showpublisheddocument/138092/639129159798330000",
      },
      {
        label: "FY2027 programmed streets",
        url: "https://www.newtonma.gov/home/showpublisheddocument/138847/639146911710544001",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
    },
    estimatedCost: 95000000,
    completionDate: null,
  },
  {
    id: "needham-street-upgrades",
    name: "Needham Street Upgrades",
    address: "Needham Street",
    village: "Newton Upper Falls",
    status: "Under Construction",
    type: "Transportation",
    description:
      "MassDOT-led and funded reconstruction of Needham Street, including roadway improvements, traffic signal upgrades, multimodal safety improvements, bicycle facilities, crossings, and signal coordination.",
    lastUpdated: UPDATED_AT,
    sourceUrl:
      "https://www.newtonma.gov/government/planning/transportation-planning/projects",
    history: [],
    rawStatus: "Under construction",
    links: [
      {
        label: "City transportation projects",
        url: "https://www.newtonma.gov/government/planning/transportation-planning/projects",
      },
      {
        label: "City FY2027-FY2031 CIP",
        url: "https://www.newtonma.gov/home/showpublisheddocument/138092/639129159798330000",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
    },
    estimatedCost: 34250360,
    completionDate: null,
  },
  {
    id: "auburn-street-commonwealth-avenue-intersection-improvement",
    name: "Auburn Street at Commonwealth Avenue Intersection Improvement",
    address: "Auburn Street & Commonwealth Avenue",
    village: "Auburndale",
    status: "Under Construction",
    type: "Transportation",
    description:
      "MassDOT project to upgrade the Auburn Street and Commonwealth Avenue intersection with a mixed-lane modern roundabout, improved multimodal accommodations, new open space, and coordination with rehabilitation of the Commonwealth Avenue bridge over the Charles River.",
    lastUpdated: UPDATED_AT,
    sourceUrl:
      "https://www.newtonma.gov/government/planning/transportation-planning/projects",
    history: [],
    rawStatus: "Under construction",
    links: [
      {
        label: "City transportation projects",
        url: "https://www.newtonma.gov/government/planning/transportation-planning/projects",
      },
      {
        label: "City Public Works construction information",
        url: "https://www.newtonma.gov/government/public-works/construction-projects",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
    },
    estimatedCost: null,
    completionDate: null,
  },
  {
    id: "commonwealth-avenue-carriageway-redesign",
    name: "Commonwealth Avenue Carriageway Redesign",
    address: "Commonwealth Avenue Carriageway, Lyons Field to Marriott",
    village: "Auburndale",
    status: "Completed",
    type: "Transportation",
    description:
      "Redesign of the Commonwealth Avenue Carriageway segment from Lyons Field to the Marriott to increase green space, improve sidewalks and crossings, add a two-way bicycle path, and reduce pavement. The City reported the work as largely complete by the end of 2025.",
    lastUpdated: UPDATED_AT,
    sourceUrl:
      "https://www.newtonma.gov/government/planning/transportation-planning/projects/commonwealth-avenue-carriageway-redesign",
    history: [],
    rawStatus: "Largely complete by end of 2025",
    links: [
      {
        label: "City Commonwealth Avenue Carriageway project",
        url: "https://www.newtonma.gov/government/planning/transportation-planning/projects/commonwealth-avenue-carriageway-redesign",
      },
      {
        label: "City transportation projects",
        url: "https://www.newtonma.gov/government/planning/transportation-planning/projects",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
    },
    estimatedCost: null,
    completionDate: "December 2025",
  },
  {
    id: "christina-street-bridge",
    name: "Christina Street Bridge Feasibility Study and Conceptual Design",
    address: "Christina Street",
    village: "Newton Upper Falls",
    status: "Under Review",
    type: "Transportation",
    description:
      "Feasibility and conceptual design work to restore the Christina Street bridge as a shared-use path connection between Newton and Needham, linking the Needham Street corridor, Upper Falls Greenway, Blue Heron Trail, Charles River Reservation, and nearby neighborhoods.",
    lastUpdated: UPDATED_AT,
    sourceUrl:
      "https://www.newtonma.gov/government/planning/divisions/transportation-planning/projects/christina-street-bridge",
    history: [],
    rawStatus: "In design / feasibility",
    links: [
      {
        label: "City Christina Street Bridge project",
        url: "https://www.newtonma.gov/government/planning/divisions/transportation-planning/projects/christina-street-bridge",
      },
      {
        label: "City transportation projects",
        url: "https://www.newtonma.gov/government/planning/transportation-planning/projects",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
    },
    estimatedCost: null,
    completionDate: null,
  },
  {
    id: "hammond-pond-parkway-complete-street",
    name: "Hammond Pond Parkway Complete Street",
    address: "Hammond Pond Parkway",
    village: "Chestnut Hill",
    status: "Under Construction",
    type: "Transportation",
    description:
      "DCR-led project to redesign Hammond Pond Parkway as a complete street, including a shared-use path on the west side, a sidewalk on the east side, and changes to the roadway configuration while maintaining access at Beacon Street and the shopping center driveway.",
    lastUpdated: UPDATED_AT,
    sourceUrl:
      "https://www.newtonma.gov/government/planning/transportation-planning/projects",
    history: [],
    rawStatus: "Under construction",
    links: [
      {
        label: "City transportation projects",
        url: "https://www.newtonma.gov/government/planning/transportation-planning/projects",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
    },
    estimatedCost: null,
    completionDate: null,
  },
  {
    id: "newton-corner-improvements",
    name: "Newton Corner Improvements Project",
    address: "Newton Corner / I-90 Interchange",
    village: "Newton Corner",
    status: "Under Review",
    type: "Transportation",
    description:
      "MassDOT-led project addressing traffic backups and safety issues around the I-90/Newton Corner interchange. Short-term improvements are complete while longer-term planning remains underway.",
    lastUpdated: UPDATED_AT,
    sourceUrl:
      "https://www.newtonma.gov/government/planning/transportation-planning/projects",
    history: [],
    rawStatus: "Long-term planning study under way",
    links: [
      {
        label: "City transportation projects",
        url: "https://www.newtonma.gov/government/planning/transportation-planning/projects",
      },
    ],
    facts: {
      units: null,
      affordableUnits: null,
      stories: null,
      parkingSpaces: null,
    },
    estimatedCost: null,
    completionDate: null,
  },
];
