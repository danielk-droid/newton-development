import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";

type ProjectFacts = {
  units: number | null;
  affordableUnits: number | null;
  stories: number | null;
  parkingSpaces: number | null;
};

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  village?: string;
  facts?: ProjectFacts;
};

type SourceData = {
  source: string;
  fetchedAt: string;
  projectCount: number;
  projects: Project[];
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

function formatNumber(value: number) {
  return value.toLocaleString();
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusClasses(status: string) {
  switch (status) {
    case "Under Construction":
      return "bg-amber-100 text-amber-900";

    case "Approved":
    case "Approved with Conditions":
      return "bg-emerald-100 text-emerald-900";

    case "Completed":
      return "bg-slate-200 text-slate-800";

    case "Submitted":
    case "Under Review":
    case "Scheduled for Hearing":
      return "bg-blue-100 text-blue-900";

    case "Appealed":
    case "Denied":
    case "Withdrawn":
    case "Cancelled":
      return "bg-red-100 text-red-900";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function HomePage() {
  const data = await getSourceData();

  const projects = data.projects;

  const totalUnits = projects.reduce(
    (total, project) =>
      total + (project.facts?.units ?? 0),
    0
  );

  const totalAffordableUnits = projects.reduce(
    (total, project) =>
      total + (project.facts?.affordableUnits ?? 0),
    0
  );

  const projectsUnderConstruction = projects.filter(
    (project) => project.status === "Under Construction"
  ).length;

  const projectsApproved = projects.filter(
    (project) =>
      project.status === "Approved" ||
      project.status === "Approved with Conditions"
  ).length;

  const projectsSubmitted = projects.filter(
    (project) => project.status === "Submitted"
  ).length;

  const projectsCompleted = projects.filter(
    (project) => project.status === "Completed"
  ).length;

  const villageCounts = projects.reduce<Record<string, number>>(
    (counts, project) => {
      const village = project.village ?? "Unknown";

      counts[village] = (counts[village] ?? 0) + 1;

      return counts;
    },
    {}
  );

  const villages = Object.entries(villageCounts).sort(
    (a, b) => b[1] - a[1]
  );

  const activeProjects = projects
    .filter(
      (project) =>
        project.status !== "Completed" &&
        project.status !== "Cancelled" &&
        project.status !== "Withdrawn"
    )
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="border-b border-slate-200 pb-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Newton Development
          </p>

          <h1 className="mt-3 max-w-4xl text-5xl font-bold tracking-tight md:text-6xl">
            Understand what is being developed in Newton.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Track development projects, understand where they
            stand, and follow the public records behind them.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Explore all projects
            </Link>
          </div>
        </header>

        <section className="mt-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              At a glance
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Newton development activity
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500">
                Projects tracked
              </p>

              <p className="mt-2 text-4xl font-bold">
                {formatNumber(data.projectCount)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500">
                Residential units
              </p>

              <p className="mt-2 text-4xl font-bold">
                {formatNumber(totalUnits)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500">
                Affordable units
              </p>

              <p className="mt-2 text-4xl font-bold">
                {formatNumber(totalAffordableUnits)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500">
                Under construction
              </p>

              <p className="mt-2 text-4xl font-bold">
                {formatNumber(projectsUnderConstruction)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-6">
            <p className="text-sm font-medium text-slate-500">
              Approved
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatNumber(projectsApproved)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-6">
            <p className="text-sm font-medium text-slate-500">
              Submitted
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatNumber(projectsSubmitted)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-6">
            <p className="text-sm font-medium text-slate-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatNumber(projectsCompleted)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-6">
            <p className="text-sm font-medium text-slate-500">
              Active projects
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatNumber(activeProjects.length)}
            </p>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                What is happening
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Current projects
              </h2>
            </div>

            <Link
              href="/projects"
              className="text-sm font-semibold underline underline-offset-4"
            >
              View all
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {activeProjects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-slate-200 p-6"
              >
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClasses(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>

                  {project.village &&
                    project.village !== "Unknown" && (
                      <span className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600">
                        {project.village}
                      </span>
                    )}
                </div>

                <h3 className="mt-5 text-xl font-semibold">
                  {project.name}
                </h3>

                <p className="mt-3 line-clamp-4 leading-6 text-slate-600">
                  {project.description}
                </p>

                <Link
                  href={`/projects/${project.id}`}
                  className="mt-6 inline-block text-sm font-semibold underline underline-offset-4"
                >
                  View project
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Geography
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Projects by village
              </h2>
            </div>

            <Link
              href="/projects"
              className="text-sm font-semibold underline underline-offset-4"
            >
              View all projects
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 p-6">
            <div className="space-y-5">
              {villages.map(([village, count]) => {
                const percentage =
                  projects.length > 0
                    ? (count / projects.length) * 100
                    : 0;

                return (
                  <div key={village}>
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-slate-900">
                        {village}
                      </p>

                      <p className="text-sm text-slate-500">
                        {count}{" "}
                        {count === 1
                          ? "project"
                          : "projects"}
                      </p>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-16 border-t border-slate-200 pt-8">
          <div className="rounded-2xl bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-900">
              About this data
            </p>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Newton Development is an independent project and
              is not affiliated with the City of Newton. Project
              information is collected from public City sources
              and presented here in a structured format to make
              development activity easier to understand.
            </p>

            <p className="mt-3 text-sm text-slate-500">
              {data.projectCount} projects currently tracked.
              Last collected {formatDate(data.fetchedAt)}.
            </p>

            <a
              href={data.source}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-semibold underline underline-offset-4"
            >
              View the official City source
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}