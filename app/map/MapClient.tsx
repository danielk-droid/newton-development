"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import coordinateData from "../../data/project-coordinates.json";

type Project = { id: string; name: string; address: string; village: string; status: string; type?: string; description: string };
type Props = { projects: Project[] };
type Point = { lat: number; lon: number; matchedAddress: string; method: string; exact?: boolean };
type MapInstance = { remove: () => void; setView: (center: [number, number], zoom: number) => MapInstance; fitBounds: (bounds: unknown) => MapInstance };
type MarkerInstance = { addTo: (map: MapInstance) => MarkerInstance; bindPopup: (html: string) => MarkerInstance; on: (event: string, callback: () => void) => MarkerInstance };
type Leaflet = { map: (element: HTMLElement, options?: Record<string, unknown>) => MapInstance; tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: MapInstance) => unknown }; divIcon: (options: Record<string, unknown>) => unknown; marker: (point: [number, number], options: Record<string, unknown>) => MarkerInstance; latLngBounds: (points: [number, number][]) => { pad: (value: number) => unknown } };

declare global { interface Window { L?: Leaflet; __newtonProjectMap?: MapInstance } }

function typeLabel(type?: string) { if (type === "Public Building") return "Public building"; if (type === "Transportation") return "Transportation"; if (type === "Housing") return "Housing"; if (type === "Mixed-Use") return "Mixed-use"; if (type === "Commercial") return "Commercial"; if (type === "Historic Preservation") return "Historic preservation"; if (type === "Zoning") return "Zoning"; return type ?? "Project"; }
function markerClass(type?: string) { if (type === "Public Building") return "bg-indigo-600"; if (type === "Transportation") return "bg-cyan-600"; if (type === "Housing" || type === "Mixed-Use" || type === "Commercial") return "bg-emerald-600"; return "bg-slate-700"; }
function markerIcon(type?: string) {
  const color = type === "Transportation" ? "#0891b2" : type === "Public Building" ? "#4f46e5" : type === "Housing" || type === "Mixed-Use" || type === "Commercial" ? "#059669" : "#334155";
  const icon = type === "Housing" || type === "Mixed-Use" ? '<path d="M4 10.5 12 4l8 6.5"/><path d="M6.5 9.5V20h11V9.5"/><path d="M10 20v-5h4v5"/>' : type === "Commercial" ? '<path d="M4 10h16l-1.5-5h-13L4 10Z"/><path d="M5 10v10h14V10"/><path d="M9 20v-5h6v5"/>' : type === "Public Building" ? '<path d="M3 20h18"/><path d="M5 20V9h14v11"/><path d="M4 9 12 4l8 5"/>' : type === "Transportation" ? '<path d="M5 19 19 5"/><path d="M7 7h5V2"/><path d="M17 17h-5v5"/>' : '<path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>';
  return `<div style="width:34px;height:34px;border-radius:11px;border:3px solid white;box-shadow:0 2px 8px rgba(15,23,42,.28);background:${color};display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="white" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg></div>`;
}
const coordinatePoints = Object.fromEntries((coordinateData.projects ?? []).map((item) => [item.id, { lat: item.lat, lon: item.lon, matchedAddress: item.matchedAddress, method: item.method, exact: true }])) as Record<string, Point>;

export default function MapClient({ projects }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [locations, setLocations] = useState<Record<string, Point>>(coordinatePoints);
  const [locationProgress, setLocationProgress] = useState(0);
  const [locationMessage, setLocationMessage] = useState("Preparing official Newton GIS locations");

  const filteredProjects = useMemo(() => { const q = search.trim().toLowerCase(); return projects.filter((project) => { if (q && ![project.name, project.address, project.village, project.type ?? "", project.description].join(" ").toLowerCase().includes(q)) return false; if (type !== "All" && project.type !== type) return false; if (status !== "All" && project.status !== status) return false; return true; }); }, [projects, search, type, status]);

  useEffect(() => {
    let cancelled = false;
    async function loadLocations() {
      setMapReady(false);
      setMapError(null);
      const next: Record<string, Point> = { ...coordinatePoints };
      const pending = projects.filter((project) => !next[project.id]);
      setLocationProgress(pending.length ? 0 : 100);
      setLocationMessage(pending.length ? "Locating projects from official Newton GIS" : "Using saved official GIS locations");

      for (let index = 0; index < pending.length; index += 1) {
        const project = pending[index];
        try {
          const response = await fetch(`/api/project-locations?id=${encodeURIComponent(project.id)}`, { cache: "no-store" });
          if (!response.ok) throw new Error("Location lookup failed.");
          const data = await response.json();
          if (data.location) next[project.id] = data.location;
        } catch {
          // Keep going so one unavailable record cannot hide the rest of the map.
        }
        if (!cancelled) {
          const completed = index + 1;
          setLocationProgress(Math.round((completed / pending.length) * 100));
          setLocationMessage(`Locating project ${completed} of ${pending.length}`);
        }
      }

      if (cancelled) return;
      setLocations(next);
      try {
        const L = await loadLeaflet();
        const element = document.getElementById("newton-project-map");
        if (!element) return;
        window.__newtonProjectMap?.remove();
        const map = L.map(element, { scrollWheelZoom: true }).setView([42.337, -71.209], 12.2);
        window.__newtonProjectMap = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors", maxZoom: 19 }).addTo(map);
        const visible = filteredProjects.filter((project) => next[project.id]);
        for (const project of visible) {
          const point = next[project.id];
          const icon = L.divIcon({ className: "newton-map-marker", html: markerIcon(project.type), iconSize: [34, 34], iconAnchor: [17, 17] });
          const locationLabel = point.exact === false ? "Reference location" : "Official GIS address";
          L.marker([point.lat, point.lon], { icon }).addTo(map)
            .bindPopup(`<strong>${escapeHtml(project.name)}</strong><br/><span>${escapeHtml(typeLabel(project.type))} · ${escapeHtml(project.status)}</span><br/><small>${locationLabel}: ${escapeHtml(point.matchedAddress)}</small><br/><a href="/projects/${encodeURIComponent(project.id)}">View project</a>`)
            .on("click", () => setSelectedId(project.id));
        }
        if (visible.length > 0) map.fitBounds(L.latLngBounds(visible.map((project) => [next[project.id].lat, next[project.id].lon] as [number, number])).pad(0.08));
        setMapReady(true);
      } catch (error) {
        setMapError(error instanceof Error ? error.message : "The map could not be loaded.");
      }
    }
    void loadLocations();
    return () => { cancelled = true; };
  }, [projects, filteredProjects]);
