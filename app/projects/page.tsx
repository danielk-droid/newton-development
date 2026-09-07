import Link from "next/link";
import ProjectsClient from "./ProjectsClient";
import { allProjects } from "../../data/project-catalog";

export const metadata = { title: "Projects", description: "Browse tracked development, public-building, and transportation projects in Newton, Massachusetts." };

export default function ProjectsPage() {
  const activeProjects = allProjects.filter((project) => !["Completed", "Cancelled", "Withdrawn"].includes(project.status)).length;
  const underConstruction = allProjects.filter((project) => project.status === "Under Construction").length;
  const completedProjects = allProjects.filter((project) => project.status === "Completed").length;
  const publicProjects = allProjects.filter((project) => project.type === "Public Building").length;
  const transportationProjects = allProjects.filter((project) => project.type === "Transportation").length;
  const latestChecked = allProjects.reduce((latest, project) => project.lastUpdated > latest ? project.lastUpdated : latest, "");

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 md:py-14">
        <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-7 py-9 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:px-10 md:py-11">
          <div className="absolute right-[-5rem] top-[-6rem] h-64 w-64 rounded-full bg-sky-50" aria-hidden="true" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Project directory</p>
              <h1 className="mt-3 text-4xl font-bold tracking-[-0.045em] text-slate-950 md:text-5xl">Projects changing Newton</h1>
              <p className="mt-5 text-base leading-7 text-slate-600 md:text-lg md:leading-8">Track major private development, public-building, and transportation projects with clear status information and links to the official records behind them.</p>
            </div>
            <Link href="/map" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-strong)] hover:shadow-md">Explore interactive map <span aria-hidden="true">→</span></Link>
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Project overview">
          {[["Projects tracked", allProjects.length], ["Active", activeProjects], ["Under construction", underConstruction], ["Public buildings", publicProjects], ["Transportation", transportationProjects]].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-[-0.03em]">{value}</p></div>
          ))}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-6" aria-label="Data coverage">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><p className="text-sm font-bold text-slate-950">Data coverage</p><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">The directory combines project records from official City sources across private development, public buildings, and transportation. Each project page links back to its source records.</p></div>
            <p className="shrink-0 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">Data checked {new Date(latestChecked).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="browse-projects">
          <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Directory</p><h2 id="browse-projects" className="mt-2 text-2xl font-bold tracking-tight">Browse projects</h2><p className="mt-1 text-sm text-slate-500">Search by project, address, village, type, status, or description.</p></div><p className="text-sm text-slate-500 sm:text-right">{completedProjects} completed {completedProjects === 1 ? "project" : "projects"}</p></div>
          <ProjectsClient projects={allProjects} />
        </section>

        <footer className="mt-14 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-500"><p className="max-w-3xl">Newton Development is an independent project and is not affiliated with or operated by the City of Newton. Use the linked official sources to verify current information.</p></footer>
      </div>
    </main>
  );
}
