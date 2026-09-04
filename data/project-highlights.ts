export type ProjectHighlight = {
  label: string;
  value: string;
  sourceUrl: string;
};

/**
 * Curated, verified facts that are important enough to surface on project cards.
 * Every displayed highlight has an explicit authoritative source URL.
 */
export const projectHighlights: Record<string, ProjectHighlight[]> = {
  "countryside-elementary-school-191-dedham-street": [
    { label: "Design enrollment", value: "465 students", sourceUrl: "https://www.newton.k12.ma.us/district-at-a-glance/long-range-planning-and-building-projects/current-building-projects/countryside-elementary" },
    { label: "Grades", value: "K–5", sourceUrl: "https://www.newton.k12.ma.us/district-at-a-glance/long-range-planning-and-building-projects/current-building-projects/countryside-elementary" },
    { label: "Heating & cooling", value: "Ground-source heat pumps", sourceUrl: "https://www.newton.k12.ma.us/district-at-a-glance/long-range-planning-and-building-projects/current-building-projects/countryside-elementary" },
    { label: "Occupancy", value: "January 2027", sourceUrl: "https://www.newton.k12.ma.us/district-at-a-glance/long-range-planning-and-building-projects/current-building-projects/countryside-elementary" },
  ],
  "franklin-elementary-school-125-derby-street": [
    { label: "Project cost", value: "$71M", sourceUrl: "https://www.newtonma.gov/home/showpublisheddocument/123585/638651367962470000" },
    { label: "Occupancy", value: "February 2027", sourceUrl: "https://www.newton.k12.ma.us/district-at-a-glance/long-range-planning-and-building-projects/current-building-projects" },
  ],
  "horace-mann-elementary-school-225-nevada-street": [
    { label: "Project cost", value: "$31.6M", sourceUrl: "https://www.newtonma.gov/home/showpublisheddocument/123585/638651367962470000" },
    { label: "Occupancy", value: "September 2026", sourceUrl: "https://www.newton.k12.ma.us/district-at-a-glance/long-range-planning-and-building-projects/current-building-projects" },
    { label: "Project type", value: "Addition + renovation", sourceUrl: "https://www.newtonma.gov/government/public-buildings/capital-projects-investing-now-for-newton-s-future/school-projects/horace-mann" },
  ],
  "lincoln-eliot-elementary-school-150-jackson-road": [
    { label: "General classrooms", value: "18", sourceUrl: "https://www.newtonma.gov/home/showpublisheddocument/137579/639113340796270000" },
    { label: "Special-education classrooms", value: "4", sourceUrl: "https://www.newtonma.gov/home/showpublisheddocument/137579/639113340796270000" },
    { label: "Project cost", value: "$51.9M", sourceUrl: "https://www.newtonma.gov/home/showpublisheddocument/137579/639113340796270000" },
    { label: "Opened", value: "September 2025", sourceUrl: "https://www.newtonma.gov/home/showpublisheddocument/137579/639113340796270000" },
  ],
  "underwood-school-redevelopment": [
    { label: "Year built", value: "1924", sourceUrl: "https://www.newton.k12.ma.us/district-at-a-glance/long-range-planning-and-building-projects" },
    { label: "Planning status", value: "Highest-priority school facility", sourceUrl: "https://www.newton.k12.ma.us/district-at-a-glance/long-range-planning-and-building-projects" },
  ],
  "ward-school-redevelopment": [
    { label: "Year built", value: "1928", sourceUrl: "https://www.newton.k12.ma.us/district-at-a-glance/long-range-planning-and-building-projects" },
    { label: "Planning status", value: "Highest-priority school facility", sourceUrl: "https://www.newton.k12.ma.us/district-at-a-glance/long-range-planning-and-building-projects" },
  ],
  "cooper-center-for-active-living": [
    { label: "Building size", value: "33,000 sq ft", sourceUrl: "https://www.newtonma.gov/government/public-buildings/capital-projects-investing-now-for-newton-s-future/municipal-facilities-projects/newton-center-for-active-living" },
    { label: "Opened", value: "December 2025", sourceUrl: "https://www.newtonma.gov/government/public-buildings" },
    { label: "Project cost", value: "$30.5M", sourceUrl: "https://www.newtonma.gov/home/showpublisheddocument/138092/639129159798330000" },
  ],
  "gath-memorial-pool-renovation": [
    { label: "Main pool", value: "Competition pool", sourceUrl: "https://www.newtonma.gov/government/parks-recreation-culture/aquatics/gath-memorial-pool-renovation-project" },
    { label: "Recreation", value: "Zero-entry pool + splash pads", sourceUrl: "https://www.newtonma.gov/government/parks-recreation-culture/aquatics/gath-memorial-pool-renovation-project" },
  ],
  "auburn-street-commonwealth-avenue-intersection-improvement": [
    { label: "Intersection", value: "Modern mixed-lane roundabout", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/auburn-st-comm-ave-intersection" },
    { label: "Pedestrian safety", value: "Pedestrian hybrid beacons", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/auburn-st-comm-ave-intersection" },
    { label: "Bicycle access", value: "Bike accommodations on both sides", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/auburn-st-comm-ave-intersection" },
    { label: "Related work", value: "Commonwealth Ave bridge rehabilitation", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/auburn-st-comm-ave-intersection" },
  ],
  "christina-street-bridge": [
    { label: "Connection", value: "Newton ↔ Needham", sourceUrl: "https://www.newtonma.gov/government/planning/divisions/transportation-planning/projects/christina-street-bridge" },
    { label: "Facility", value: "New pedestrian & bicycle bridge", sourceUrl: "https://www.newtonma.gov/government/planning/divisions/transportation-planning/projects/christina-street-bridge" },
    { label: "Design status", value: "Pre-25% design completed", sourceUrl: "https://www.newtonma.gov/government/planning/divisions/transportation-planning/projects/christina-street-bridge" },
  ],
  "transportation-network-improvement-program": [
    { label: "Annual investment", value: "$9.5M", sourceUrl: "https://www.newtonma.gov/home/showpublisheddocument/138092/639129159798330000" },
    { label: "Program scope", value: "Roads, sidewalks, ADA ramps & bike facilities", sourceUrl: "https://www.newtonma.gov/government/public-works" },
  ],
  "newton-commuter-rail-accessibility-improvements": [
    { label: "Stations", value: "3 Newton commuter rail stations", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects" },
    { label: "Purpose", value: "Accessibility improvements", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects" },
  ],
  "needham-street-upgrades": [
    { label: "Corridor", value: "Webster St to Route 9", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/needham-street" },
    { label: "Bike facilities", value: "Raised bike lanes + shared-use path", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/needham-street" },
    { label: "Transit", value: "New bus stops", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/needham-street" },
    { label: "Stormwater", value: "Infrastructure improvements", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/needham-street" },
  ],
  "hammond-pond-parkway-complete-street": [
    { label: "Roadway", value: "4 lanes → 2 lanes", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/hammond-pond-parkway-improvement-project" },
    { label: "Shared path", value: "Bike + pedestrian shared-use path", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/hammond-pond-parkway-improvement-project" },
    { label: "Accessibility", value: "ADA-compliant access", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/hammond-pond-parkway-improvement-project" },
    { label: "Bridge", value: "Redesigned for pedestrians and cyclists", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/hammond-pond-parkway-improvement-project" },
  ],
  "commonwealth-avenue-carriageway-redesign": [
    { label: "Segment", value: "Lyons Field → Marriott", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/commonwealth-avenue-carriageway-redesign" },
    { label: "Bike & walking", value: "Continuous two-way path", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/commonwealth-avenue-carriageway-redesign" },
    { label: "Open space", value: "New green space", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/commonwealth-avenue-carriageway-redesign" },
    { label: "Funding", value: "$5.9M confirmed", sourceUrl: "https://www.newtonma.gov/government/planning/transportation-planning/projects/commonwealth-avenue-carriageway-redesign" },
  ],
};
