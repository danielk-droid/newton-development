import Link from "next/link";
import ProjectsClient from "./ProjectsClient";
import { allProjects } from "../../data/project-catalog";

export default function ProjectsPage() {
  const activeProjects = allProjects.filter(
    (project) =>
      project.status !== "Completed" &&
      project.status !== "Cancelled" &&
      project.status !== "Withdrawn"
  ).length;

  const underConstruction = allProjects.filter(
    (project) => project.status === "Under Construction"
  ).length;

  const completedProjects = allProjects.filter(
    (project) => project.status === "Completed"
  ).length;

  const publicProjects = allProjects.filter(
    (project) => project.type === "Public Building"
  ).length;

  const latestChecked = allProjects.reduce((latest, project) => {
    return project.lastUpdated > latest ? project.lastUpdated : latest;
  }, "");

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Newton development tracker
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Projects changing Newton
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Track major private development and public-building projects in one place, with clear status information and links to the official City records behind each project.
          </p>
        </header>

        <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Projects tracked</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{allProjects.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Active projects</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{activeProjects}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Under construction</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{underConstruction}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Public buildings</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{publicProjects}</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">How this tracker works</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Private development projects are synchronized from the City&apos;s development-project information. Public-building records are maintained separately from that private-development feed so the two sources are not confused.
              </p>
            </div>
            <a
              href="https://www.newtonma.gov/government/planning/development-projects"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-100"
            >
              City development source <span aria-hidden="true" className="ml-2">↗</span>
            </a>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Browse projects</h2>
              <p className="mt-1 text-sm text-slate-500">Search by project, address, village, type, status, or description.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
              <Link href="/map" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 sm:w-auto">
                <span aria-hidden="true" className="text-base">⌖</span>
                View interactive map
                <span aria-hidden="true">→</span>
              </Link>
              <div className="text-sm text-slate-500">
                Data checked <span className="font-medium text-slate-700">{new Date(latestChecked).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <ProjectsClient projects={allProjects} />
          </div>
        </section>

        <footer className="mt-16 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 text-sm leading-6 text-slate-500 md:flex-row md:items-start md:justify-between">
            <p className="max-w-2xl">
              Newton Development is an independent project and is not affiliated with or operated by the City of Newton. Always verify important information with the official City source.
            </p>
            <p className="shrink-0">{completedProjects} completed {completedProjects === 1 ? "project" : "projects"}</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
