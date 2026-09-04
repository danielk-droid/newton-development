"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Project = {
  id: string;
  name: string;
  address: string;
  village: string;
  status: string;
  type?: string;
  description: string;
};

type Props = { projects: Project[] };

type Point = {
  lat: number;
  lon: number;
};

const CACHE_KEY = "newton-development-geocodes-v1";

function typeLabel(type?: string) {
  if (type === "Public Building") return "Public building";
  if (type === "Transportation") return "Transportation";
  if (type === "Housing") return "Housing";
  if (type === "Mixed-Use") return "Mixed-use";
  if (type === "Commercial") return "Commercial";
  if (type === "Historic Preservation") return "Historic preservation";
  if (type === "Zoning") return "Zoning";
  return type ?? "Project";
}

function markerClass(type?: string) {
  if (type === "Public Building") return "bg-indigo-600";
  if (type === "Transportation") return "bg-cyan-600";
  if (type === "Housing" || type === "Mixed-Use" || type === "Commercial") return "bg-emerald-600";
  return "bg-slate-700";
}

export default function MapClient({ projects }: Props) {
  const [points, setPoints] = useState<Record<string, Point>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  const mappableProjects = useMemo(
    () => projects.filter((project) => project.address && project.address !== "Citywide"),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (q && ![project.name, project.address, project.village, project.type ?? "", project.description].join(" ").toLowerCase().includes(q)) return false;
      if (type !== "All" && project.type !== type) return false;
      if (status !== "All" && project.status !== status) return false;
      return true;
    });
  }, [projects, search, type, status]);

  useEffect(() => {
    let cancelled = false;

    async function loadPoints() {
      setLoading(true);
      setMapError(null);

      let cached: Record<string, Point> = {};
      try {
        const raw = window.localStorage.getItem(CACHE_KEY);
        if (raw) cached = JSON.parse(raw) as Record<string, Point>;
      } catch {
        cached = {};
      }

      const next = { ...cached };
      const missing = mappableProjects.filter((project) => !next[project.id]);

      try {
        for (const project of missing) {
          if (cancelled) return;
          const query = encodeURIComponent(`${project.address}, Newton, Massachusetts`);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=${query}`
          );
          if (!response.ok) throw new Error("Location service unavailable.");
          const results = (await response.json()) as Array<{ lat: string; lon: string }>;
          if (results[0]) {
            next[project.id] = { lat: Number(results[0].lat), lon: Number(results[0].lon) };
          }
          await new Promise((resolve) => setTimeout(resolve, 1100));
        }

        window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
        if (!cancelled) setPoints(next);
      } catch (error) {
        if (!cancelled) {
          setPoints(next);
          setMapError(error instanceof Error ? error.message : "Some project locations could not be loaded.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPoints();
    return () => {
      cancelled = true;
    };
  }, [mappableProjects]);

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      const L = await loadLeaflet();
      if (cancelled) return;

      const element = document.getElementById("newton-project-map");
      if (!element) return;

      const mapWindow = window as Window & { __newtonProjectMap?: { remove: () => void } };
      mapWindow.__newtonProjectMap?.remove();

      const map = L.map(element, { scrollWheelZoom: true }).setView([42.337, -71.209], 12.2);
      mapWindow.__newtonProjectMap = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const visible = filteredProjects.filter((project) => points[project.id]);

      for (const project of visible) {
        const point = points[project.id];
        const icon = L.divIcon({
          className: "",
          html: `<button aria-label="${escapeHtml(project.name)}" style="width:18px;height:18px;border-radius:9999px;border:3px solid white;box-shadow:0 1px 5px rgba(15,23,42,.35);background:${project.type === "Transportation" ? "#0891b2" : project.type === "Public Building" ? "#4f46e5" : "#059669"}"></button>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        L.marker([point.lat, point.lon], { icon })
          .addTo(map)
          .bindPopup(`<strong>${escapeHtml(project.name)}</strong><br/><span>${escapeHtml(project.status)}</span><br/><a href="/projects/${encodeURIComponent(project.id)}">View project</a>`)
          .on("click", () => setSelectedId(project.id));
      }

      if (visible.length > 0) {
        const bounds = L.latLngBounds(visible.map((project) => [points[project.id].lat, points[project.id].lon] as [number, number]));
        map.fitBounds(bounds.pad(0.08));
      }

      return () => map.remove();
    }

    void renderMap();
    return () => {
      cancelled = true;
    };
  }, [filteredProjects, points]);

  const types = Array.from(new Set(projects.map((project) => project.type).filter(Boolean))) as string[];
  const statuses = Array.from(new Set(projects.map((project) => project.status))).sort();

  return (
    <div className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="order-2 rounded-2xl border border-slate-200 bg-white shadow-sm lg:order-1">
        <div className="border-b border-slate-200 p-4">
          <label htmlFor="map-search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</label>
          <input id="map-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Project, address, village…" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="All">All types</option>
              {types.map((item) => <option key={item} value={item}>{typeLabel(item)}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="All">All statuses</option>
              {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div className="max-h-[620px] overflow-y-auto">
          {filteredProjects.map((project) => (
            <button key={project.id} type="button" onClick={() => setSelectedId(project.id)} className={`block w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${selectedId === project.id ? "bg-slate-50" : ""}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${markerClass(project.type)}`} />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{typeLabel(project.type)}</span>
              </div>
              <p className="mt-2 font-semibold leading-5 text-slate-950">{project.name}</p>
              <p className="mt-1 text-xs text-slate-500">{project.address}</p>
              <p className="mt-2 text-xs font-medium text-slate-600">{project.status}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="order-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:order-2">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">Newton project map</p>
            <p className="text-xs text-slate-500">{Object.keys(points).length} locations resolved · {filteredProjects.length} projects matching filters</p>
          </div>
          {loading && <p className="text-xs font-medium text-slate-500">Resolving project addresses…</p>}
        </div>
        <div id="newton-project-map" className="h-[560px] w-full bg-slate-100" />
        {mapError && <p className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">{mapError} Locations already cached may still appear.</p>}
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" />Development</span>
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-indigo-600" />Public building</span>
          <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-cyan-600" />Transportation</span>
          <span>Map data © OpenStreetMap contributors</span>
        </div>
      </section>

      {selectedId && (
        <div className="order-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          {(() => {
            const project = projects.find((item) => item.id === selectedId);
            if (!project) return null;
            return (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{typeLabel(project.type)} · {project.status}</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight">{project.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{project.address}</p>
                </div>
                <Link href={`/projects/${project.id}`} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">View project →</Link>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

type Leaflet = {
  map: (element: HTMLElement, options?: Record<string, unknown>) => { setView: (center: [number, number], zoom: number) => unknown; remove: () => void; fitBounds: (bounds: unknown) => unknown };
  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: unknown) => unknown };
  divIcon: (options: Record<string, unknown>) => unknown;
  marker: (point: [number, number], options: Record<string, unknown>) => { addTo: (map: unknown) => { bindPopup: (html: string) => { on: (event: string, callback: () => void) => unknown } } };
  latLngBounds: (points: [number, number][]) => { pad: (value: number) => unknown };
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

async function loadLeaflet(): Promise<Leaflet> {
  if ((window as Window & { L?: Leaflet }).L) return (window as Window & { L: Leaflet }).L;

  await new Promise<void>((resolve, reject) => {
    const style = document.getElementById("leaflet-css");
    if (!style) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existing = document.getElementById("leaflet-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Map library could not be loaded.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Map library could not be loaded."));
    document.head.appendChild(script);
  });

  return (window as Window & { L: Leaflet }).L;
}
