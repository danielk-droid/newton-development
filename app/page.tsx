import fs from "node:fs/promises";
import path from "node:path";

type SourceProject = {
  id: string;
  name: string;
  description: string;
  status: string;
  links?: {
    label: string;
    url: string;
  }[];
  sourceUrl: string;
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

export default async function HomePage() {
  const data = await getSourceData();

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Newton Development
          </p>

          <h1 className="mt-3 max-w-3xl text-5xl font-bold tracking-tight">
            Understand what is being developed in Newton.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Track development projects, understand where they stand,
            and follow the official records behind them.
          </p>

          <div className="mt-8">
            <a
              href="/projects"
              className="inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Explore all projects
            </a>
          </div>
        </header>

        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Current projects
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                What is happening in Newton
              </h2>
            </div>

            <a
              href="/projects"
              className="text-sm font-semibold underline underline-offset-4"
            >
              View all projects
            </a>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.projects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-slate-200 p-6"
              >
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
                  {project.status}
                </span>

                <h3 className="mt-5 text-xl font-semibold">
                  {project.name}
                </h3>

                <p className="mt-3 line-clamp-4 leading-6 text-slate-700">
                  {project.description}
                </p>

                <a
                  href={`/projects/${project.id}`}
                  className="mt-6 inline-block text-sm font-semibold underline underline-offset-4"
                >
                  View project
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-slate-200 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Data source
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {data.projectCount} projects collected from the
                official City of Newton development-project page.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Last collected:{" "}
                {new Date(data.fetchedAt).toLocaleString()}
              </p>
            </div>

            <a
              href={data.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold underline underline-offset-4"
            >
              View official source
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}