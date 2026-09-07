import { NextResponse } from "next/server";
import { allProjects } from "../../../data/project-catalog";

const GIS_BASE = "https://gisweb.newtonma.gov/server/rest/services/Data/MapServer";
const ADDRESS_LAYER = `${GIS_BASE}/12/query`;
const FACILITY_LAYER = `${GIS_BASE}/13/query`;
const STREET_LAYER = `${GIS_BASE}/15/query`;

type GisFeature = { geometry?: { x?: number; y?: number; paths?: number[][][] }; attributes?: Record<string, string | number | null> };
type LocationResult = {
  id: string;
  lat: number;
  lon: number;
  matchedAddress: string;
  method: "official-address-point" | "official-facility-point" | "official-street-centerline" | "official-intersection-reference" | "official-citywide-reference";
  exact: boolean;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
}

function quote(value: string) {
  return value.replace(/'/g, "''");
}

function parseAddress(value: string) {
  const match = value.match(/\b(\d{1,5}(?:-\d{1,5})?)\s+([^,]+?)(?=\s+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Parkway|Pkwy|Place|Pl|Way|Lane|Ln|Court|Ct|Circle|Cir|Terrace|Ter|Boulevard|Blvd|Highway|Hwy)\b)/i);
  if (!match) return null;
  const streetMatch = value.match(/\b\d{1,5}(?:-\d{1,5})?\s+(.+?\b(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Parkway|Pkwy|Place|Pl|Way|Lane|Ln|Court|Ct|Circle|Cir|Terrace|Ter|Boulevard|Blvd|Highway|Hwy)\b)/i);
  return streetMatch ? { number: Number(match[1].split("-")[0]), street: streetMatch[1].trim() } : null;
}

function streetNames(value: string) {
  const parts = value.split(/\s*(?:&|\bat\b|\band\b|\/)\s*/i).map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts : [value];
}

async function gis(url: string, where: string, outFields: string) {
  const params = new URLSearchParams({
    where,
    outFields,
    returnGeometry: "true",
    outSR: "4326",
    resultRecordCount: "200",
    f: "json",
  });
  const response = await fetch(`${url}?${params}`, {
    headers: { "User-Agent": "Newton Development location service" },
    next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error(`Official Newton GIS returned HTTP ${response.status}.`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message ?? "Official Newton GIS query failed.");
  return data.features ?? [];
}

async function addressPoint(address: string) {
  const parsed = parseAddress(address);
  if (!parsed) return null;
  const streetWords = normalize(parsed.street).split(" ");
  const streetName = streetWords.slice(0, -1).join(" ") || streetWords[0];
  const features = await gis(
    ADDRESS_LAYER,
    `Number=${parsed.number} AND UPPER(StreetName)=UPPER('${quote(streetName)}') AND Status <> 'Inactive'`,
    "Number,NumberSuffix,StreetName,PostType,FullStName,Address,Status,LocationType",
  );
  const feature = features.find((item: GisFeature) => Number.isFinite(item.geometry?.x) && Number.isFinite(item.geometry?.y));
  if (!feature) return null;
  return {
    lat: Number(feature.geometry.y),
    lon: Number(feature.geometry.x),
    matchedAddress: feature.attributes?.Address ?? address,
    method: "official-address-point" as const,
    exact: true,
  };
}

async function facilityPoint(name: string) {
  const features = await gis(FACILITY_LAYER, `UPPER(Name) LIKE UPPER('%${quote(name)}%')`, "Name,Type");
  const feature = features.find((item: GisFeature) => Number.isFinite(item.geometry?.x) && Number.isFinite(item.geometry?.y));
  if (!feature) return null;
  return {
    lat: Number(feature.geometry.y),
    lon: Number(feature.geometry.x),
    matchedAddress: feature.attributes?.Name ?? name,
    method: "official-facility-point" as const,
    exact: true,
  };
}

async function streetReference(name: string) {
  const normalized = normalize(name);
  const features = await gis(STREET_LAYER, `UPPER(NAME) LIKE UPPER('%${quote(normalized)}%')`, "NAME,OBJECTID");
  const points = features.flatMap((feature: GisFeature) => feature.geometry?.paths?.flat() ?? []).filter((point: number[]) => Array.isArray(point) && point.length >= 2);
  if (!points.length) return null;
  const lon = points.reduce((sum: number, point: number[]) => sum + Number(point[0]), 0) / points.length;
  const lat = points.reduce((sum: number, point: number[]) => sum + Number(point[1]), 0) / points.length;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon, matchedAddress: name.trim(), method: "official-street-centerline" as const, exact: false };
}

async function locate(project: (typeof allProjects)[number]): Promise<LocationResult> {
  const exact = await addressPoint(project.address);
  if (exact) return { id: project.id, ...exact };

  if (/pellegrini park/i.test(project.address) || /pellegrini/i.test(project.name)) {
    const facility = await facilityPoint("Pellegrini");
    if (facility) return { id: project.id, ...facility };
  }

  const names = streetNames(project.address);
  if (names.length > 1) {
    const refs = [];
    for (const name of names) {
      const point = await streetReference(name);
      if (point) refs.push(point);
    }
    if (refs.length) {
      return {
        id: project.id,
        lat: refs.reduce((sum, point) => sum + point.lat, 0) / refs.length,
        lon: refs.reduce((sum, point) => sum + point.lon, 0) / refs.length,
        matchedAddress: refs.map((point) => point.matchedAddress).join(" & "),
        method: "official-intersection-reference",
        exact: false,
      };
    }
  }

  const street = await streetReference(project.address);
  if (street) return { id: project.id, ...street };

  const cityReference = await addressPoint("1000 Commonwealth Avenue");
  if (cityReference) {
    return {
      id: project.id,
      lat: cityReference.lat,
      lon: cityReference.lon,
      matchedAddress: "Newton citywide reference",
      method: "official-citywide-reference",
      exact: false,
    };
  }

  throw new Error("No official Newton GIS location was available for this project.");
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "A project id is required." }, { status: 400 });

  const project = allProjects.find((item) => item.id === id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  try {
    const location = await locate(project);
    return NextResponse.json({ source: GIS_BASE, location });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Project location could not be resolved." },
      { status: 502 },
    );
  }
}
