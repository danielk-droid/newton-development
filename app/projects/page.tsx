import fs from "node:fs/promises";
import path from "node:path";
import ProjectsClient from "./ProjectsClient";

type SourceProject = {
  id: string;
  name: string;
  description: string;
  status: string;
  village?: string;
  facts?: {
    units: number | null;
    affordableUnits: number | null;
    stories: number | null;
    parkingSpaces: number | null;
  };
};

type SourceData = {
  source: string;
  fetchedAt: string;
  projectCount: number;
  projects: SourceProject[];
};

async function getSourceData(): Promise<SourceData> {
  const filePath = path.join(
    process.cwd(),
    "data",
    "newton-source.json"
  );

  const file = await fs.readFile(filePath, "utf8");

  return JSON.parse(file);
}

export default async function ProjectsPage() {
  const data = await getSourceData();

  const activeProjects = data.projects.filter(
    (project) =>
      project.status !== "Completed" &&
      project.status !== "Cancelled" &&
      project.status !== "Withdrawn"
  ).length;

  const underConstruction = data.projects.filter(
    (project) => project.status === "Under Construction"
  ).length;

  const completedProjects = data.projects.filter(
    (project) => project.status === "Completed"
  ).length;

  const fetchedDate = new Date(data.fetchedAt);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Newton development tracker
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Development projects
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Explore development projects tracked by the City of Newton,
            organized so you can quickly understand what is proposed,
            approved, under construction, or completed.
          </p>
        </header>

        <section className="mt-10 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">
              Projects tracked
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {data.projectCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">
              Active projects
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {activeProjects}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">
              Under construction
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {underConstruction}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Official City source
              </p>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Project information is collected from the City of Newton&apos;s
                public development-project information.
              </p>
            </div>

            <a
              href={data.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-100"
            >
              View City source
              <span aria-hidden="true" className="ml-2">
                ↗
              </span>
            </a>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Browse projects
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search by project, address, village, status, or description.
              </p>
            </div>

            <div className="text-sm text-slate-500">
              Data checked{" "}
              <span className="font-medium text-slate-700">
                {fetchedDate.toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <ProjectsClient projects={data.projects} />
          </div>
        </section>

        <footer className="mt-16 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 text-sm leading-6 text-slate-500 md:flex-row md:items-start md:justify-between">
            <p className="max-w-2xl">
              Newton Development is an independent project and is not
              affiliated with or operated by the City of Newton. Always
              verify important information with the official City source.
            </p>

            <p className="shrink-0">
              {completedProjects} completed{" "}
              {completedProjects === 1 ? "project" : "projects"}
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}