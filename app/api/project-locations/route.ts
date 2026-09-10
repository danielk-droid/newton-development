import { NextResponse } from "next/server";
import coordinateData from "../../../data/project-coordinates.json";
import { allProjects } from "../../../data/project-catalog";

const GIS_BASE = "https://gisweb.newtonma.gov/server/rest/services/Data/MapServer";

type LocationRecord = {
  id: string;
  lat: number;
  lon: number;
  matchedAddress: string;
  method: string;
  exact?: boolean;
  scope?: string;
};

const locations = new Map(
  (coordinateData.projects as LocationRecord[]).map((location) => [location.id, location]),
);

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "A project id is required." }, { status: 400 });

  if (!allProjects.some((project) => project.id === id)) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const location = locations.get(id);
  if (!location) {
    return NextResponse.json(
      { error: "This project does not have a verified official GIS location in the current dataset." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { source: GIS_BASE, location },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
