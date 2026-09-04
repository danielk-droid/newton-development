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

function formatDate(date: string) { return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default async function HomePage() {
  const source = await getSourceData();
  const activeProjects = allProjects.filter((project) => !["Completed", "Cancelled", "Withdrawn"].includes(project.status));
  const underConstruction = allProjects.filter((project) => project.status === "Under Construction").length;
  const publicProjects = allProjects.filter((project) => project.type === "Public Building").length;
  const transportationProjects = allProjects.filter((project) => project.type === "Transportation").length;
  const featuredProjects = activeProjects.slice(0, 6);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Newton, Massachusetts</p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] md:text-6xl">Track the projects changing Newton.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">A structured public-information tracker for major development, public-building, and transportation projects — with links to the official records behind the information.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/map" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700">Explore the project map <span aria-hidden="true">→</span></Link>
              <Link href="/projects" className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">Browse all projects</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 md:py-14">
        <section>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[["Projects tracked", allProjects.length], ["Active projects", activeProjects.length], ["Under construction", underConstruction], ["Public + transportation", publicProjects + transportationProjects]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-4xl font-bold tracking-tight">{value}</p></div>)}
          </div>
        </section>

        <section className="mt-14">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current activity</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Projects to watch</h2></div><Link href="/projects" className="text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950">View all projects →</Link></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="group flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"><div className="flex flex-wrap items-center gap-2"><ProjectStatusBadge status={project.status} size="sm" />{project.type && <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">{project.type}</span>}{project.village && project.village !== "Unknown" && <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">{project.village}</span>}</div><h3 className="mt-5 text-xl font-bold leading-6 tracking-tight group-hover:underline group-hover:underline-offset-4">{project.name}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{project.description}</p><span className="mt-auto pt-5 text-sm font-semibold text-slate-900">View project →</span></Link>)}
          </div>
        </section>

        <section className="mt-14">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-sm md:p-10">
            <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Newton project map</p><h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">See what is happening across the city.</h2><p className="mt-4 text-base leading-7 text-slate-300">Explore projects by location, search by address or neighborhood, filter by type and status, and open the full project record from the map.</p><Link href="/map" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100">Open the project map <span aria-hidden="true">→</span></Link></div>
          </div>
        </section>

        <section className="mt-14 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Data coverage</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Public sources, structured here.</h2><p className="mt-3 leading-7 text-slate-600">Project information is assembled from official public records and organized for easier comparison and tracking.</p><p className="mt-5 text-xs font-medium text-slate-500">Development source last collected {formatDate(source.fetchedAt)}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Project directory</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Find a specific project.</h2><p className="mt-3 leading-7 text-slate-600">Browse the complete tracked project list and filter it by status, type, or village.</p><Link href="/projects" className="mt-5 inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4">Browse projects →</Link></div>
        </section>

        <footer className="mt-14 border-t border-slate-200 pt-7 text-sm leading-6 text-slate-500"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><p className="max-w-2xl">Newton Development is an independent project and is not affiliated with the City of Newton. Use the linked official sources to verify current information.</p><a href={source.source} target="_blank" rel="noopener noreferrer" className="shrink-0 font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950">Official development source ↗</a></div></footer>
      </div>
    </main>
  );
}
