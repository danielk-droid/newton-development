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
};

export const projects: Project[] = [
  {
    id: "example-development-project",
    name: "Example Development Project",
    address: "Example address",
    village: "Newton Centre",
    status: "Under Review",
    type: "Housing",
    description:
      "Placeholder project used while the site's data structure is being built. This is not a real project listing.",
    lastUpdated: "Not yet verified",
    sourceUrl: "",
  },
];