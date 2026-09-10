import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";
import ProjectStatusBadge from "./components/ProjectStatusBadge";
import { allProjects } from "../data/project-catalog";

type SourceData = { source: string; fetchedAt: string };

async function getSourceData(): Promise<SourceData> {
  const filePath = path.join(process.cwd(), "data", "newton-source.json");
  return JSON.parse(await fs.readFile(filePath, "utf8")) as SourceData;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function typeLabel(type?: string) {
  switch (type) {
    case "Public Building": return "Public project";
    case "Transportation": return "Transportation";
    case "Housing": return "Housing";
    case "Mixed-Use": return "Mixed-use";
    case "Commercial": return "Commercial";
    default: return type ?? "Project";
  }
}

export default async function HomePage() {
  const source = await getSourceData();
  const activeProjects = allProjects.filter((project) => !["Completed", "Cancelled", "Withdrawn"].includes(project.status));
  const underConstruction = allProjects.filter((project) => project.status === "Under Construction").length;
  const publicProjects = allProjects.filter((project) => project.type === "Public Building").length;
  const transportationProjects = allProjects.filter((project) => project.type === "Transportation").length;
  const featuredProjects = activeProjects.slice(0, 6);

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <main id="main-content" className="min-h-screen">
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_25%,rgba(47,111,149,0.11),transparent_24rem)]" />
          <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-6 md:pb-24 md:pt-20">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                Newton, Massachusetts
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-[-0.045em] text-slate-950 sm:text-5xl md:text-7xl md:leading-[1.02]">Understand what is changing across Newton.</h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">A structured public-information tracker for development, public-building, and transportation projects, with the official records behind the information.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/projects" className="inline-flex min-h-12 items-center rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-strong)] hover:shadow-md">Browse projects <span className="ml-2" aria-hidden="true">→</span></Link>
                <Link href="/map" className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50">Explore the map <span className="ml-2" aria-hidden="true">↗</span></Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 md:py-14">
          <section aria-labelledby="overview-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">At a glance</p><h2 id="overview-heading" className="mt-1 text-xl font-bold tracking-tight text-slate-950">Current project landscape</h2></div>
              <p className="hidden text-xs font-medium text-slate-500 sm:block">Updated from public records</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[["Projects tracked", allProjects.length], ["Active projects", activeProjects.length], ["Under construction", underConstruction], ["Public + transportation", publicProjects + transportationProjects]].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-md">
                  <p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-[-0.03em] text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14" aria-labelledby="watch-heading">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current activity</p><h2 id="watch-heading" className="mt-2 text-3xl font-bold tracking-[-0.03em] text-slate-950">Projects to watch</h2></div>
              <Link href="/projects" className="text-sm font-bold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950 hover:decoration-slate-600">View all projects →</Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="group flex min-h-60 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
                  <div className="flex flex-wrap items-center gap-2"><ProjectStatusBadge status={project.status} size="sm" />{project.type && <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">{typeLabel(project.type)}</span>}{project.village && project.village !== "Unknown" && <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">{project.village}</span>}</div>
                  <h3 className="mt-5 text-xl font-bold leading-6 tracking-tight text-slate-950 group-hover:underline group-hover:underline-offset-4">{project.name}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{project.description}</p>
                  <span className="mt-auto pt-6 text-sm font-bold text-slate-900">Open project record <span aria-hidden="true">→</span></span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-14" aria-labelledby="map-heading">
            <div className="relative overflow-hidden rounded-3xl bg-[var(--brand)] px-7 py-9 text-white shadow-lg md:px-10 md:py-11">
              <div className="absolute right-[-5rem] top-[-7rem] h-72 w-72 rounded-full border border-white/10" />
              <div className="absolute right-[-1rem] top-[-3rem] h-48 w-48 rounded-full border border-white/10" />
              <div className="relative max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Explore by location</p><h2 id="map-heading" className="mt-3 text-3xl font-bold tracking-[-0.03em] md:text-4xl">See development across the city.</h2><p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">Search projects by location, filter the map by type and status, and open the underlying project record.</p><Link href="/map" className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-100">Open project map <span className="ml-2" aria-hidden="true">→</span></Link></div>
            </div>
          </section>

          <section className="mt-14 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]" aria-label="Data and methodology">
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Data coverage</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Public records, organized for comparison.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Information is assembled from official public records and presented with links back to the underlying sources.</p><p className="mt-5 text-xs font-medium text-slate-500">Development source last collected {formatDate(source.fetchedAt)}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Start exploring</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Looking for one project?</h2><p className="mt-3 leading-7 text-slate-300">Search the complete directory by project name, type, status, or village.</p><Link href="/projects" className="mt-5 inline-flex font-bold text-white underline decoration-slate-500 underline-offset-4 hover:decoration-white">Open directory →</Link></div>
          </section>

          <footer className="mt-14 border-t border-slate-200 pt-7 text-sm leading-6 text-slate-500"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><p className="max-w-2xl">Newton Development is an independent project and is not affiliated with the City of Newton. Use the linked official sources to verify current information.</p><a href={source.source} target="_blank" rel="noopener noreferrer" className="shrink-0 font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">Official development source ↗</a></div></footer>
        </div>
      </main>
    </>
  );
}
