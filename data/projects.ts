import sourceData from "./newton-source.json";

export type ProjectStatus =
  | "Proposed"
  | "Submitted"
  | "Under Review"
  | "Scheduled for Hearing"
  | "Continued"
  | "Approved"
  | "Approved with Conditions"
  | "Denied"
  | "Withdrawn"
  | "Appealed"
  | "Under Construction"
  | "Completed"
  | "Cancelled"
  | "Unknown";

export type ProjectType =
  | "Housing"
  | "Commercial"
  | "Mixed-Use"
  | "Zoning"
  | "Transportation"
  | "Public Building"
  | "Historic Preservation"
  | "Other";

export type ProjectEvent = {
  date: string;
  title: string;
  description: string;
  sourceUrl: string;
};

export type Project = {
  id: string;
  name: string;
  address: string;
  village: string;
  status: ProjectStatus;
  type: ProjectType;
  description: string;
  lastUpdated: string;
  sourceUrl: string;
  history: ProjectEvent[];
};

function cleanText(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getVillage(name: string): string {
  const villages = [
    "Auburndale",
    "Chestnut Hill",
    "Newton Centre",
    "Newton Corner",
    "Newton Highlands",
    "Newton Lower Falls",
    "Newton Upper Falls",
    "Newtonville",
    "Nonantum",
    "Oak Hill",
    "Thompsonville",
    "Waban",
    "West Newton",
  ];

  const cleanedName = cleanText(name);

  const village = villages.find((item) =>
    cleanedName.toLowerCase().includes(item.toLowerCase())
  );

  return village ?? "Unknown";
}

function getAddress(name: string): string {
  const cleanedName = cleanText(name);

  const parts = cleanedName.split(",");

  if (parts.length > 1) {
    return parts.slice(0, -1).join(",").trim();
  }

  return cleanedName;
}

function getProjectType(
  name: string,
  description: string
): ProjectType {
  const text = `${name} ${description}`.toLowerCase();

  if (
    text.includes("mixed use") ||
    text.includes("mixed-use") ||
    text.includes("retail") ||
    text.includes("commercial space")
  ) {
    return "Mixed-Use";
  }

  if (
    text.includes("apartment") ||
    text.includes("housing") ||
    text.includes("residential") ||
    text.includes("units") ||
    text.includes("condominium")
  ) {
    return "Housing";
  }

  return "Other";
}

function normalizeStatus(rawStatus: string): {
  status: ProjectStatus;
  label: string;
} {
  const status = cleanText(rawStatus).toLowerCase();

  if (status.includes("under construction")) {
    return {
      status: "Under Construction",
      label: "Under Construction",
    };
  }

  if (
    status.includes("complete") ||
    status.includes("completed")
  ) {
    return {
      status: "Completed",
      label: "Completed",
    };
  }

  if (status.includes("denied")) {
    return {
      status: "Denied",
      label: "Denied",
    };
  }

  if (status.includes("appeal")) {
    return {
      status: "Appealed",
      label: "Appealed",
    };
  }

  if (
    status.includes("approved with conditions")
  ) {
    return {
      status: "Approved with Conditions",
      label: "Approved with Conditions",
    };
  }

  if (status.includes("approved")) {
    return {
      status: "Approved",
      label: "Approved",
    };
  }

  if (status.includes("continued")) {
    return {
      status: "Continued",
      label: "Continued",
    };
  }

  if (
    status.includes("hearing") ||
    status.includes("scheduled")
  ) {
    return {
      status: "Scheduled for Hearing",
      label: "Scheduled for Hearing",
    };
  }

  if (
    status.includes("review") ||
    status.includes("committee")
  ) {
    return {
      status: "Under Review",
      label: "Under Review",
    };
  }

  if (status.includes("filed")) {
    return {
      status: "Submitted",
      label: "Submitted",
    };
  }

  if (status.includes("proposed")) {
    return {
      status: "Proposed",
      label: "Proposed",
    };
  }

  if (status.includes("withdrawn")) {
    return {
      status: "Withdrawn",
      label: "Withdrawn",
    };
  }

  if (status.includes("cancelled") || status.includes("canceled")) {
    return {
      status: "Cancelled",
      label: "Cancelled",
    };
  }

  return {
    status: "Unknown",
    label: cleanText(rawStatus),
  };
}

export const projects: Project[] = sourceData.projects.map((project) => {
  const cleanedName = cleanText(project.name);
  const cleanedDescription = cleanText(project.description);
  const normalized = normalizeStatus(project.status);

  return {
    id: project.id,
    name: cleanedName,
    address: getAddress(cleanedName),
    village: getVillage(cleanedName),
    status: normalized.status,
    type: getProjectType(cleanedName, cleanedDescription),
    description: cleanedDescription,
    lastUpdated: new Date(sourceData.fetchedAt).toLocaleString(),
    sourceUrl: project.sourceUrl,
    history: [],
  };
});