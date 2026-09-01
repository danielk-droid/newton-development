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

export default async function ProjectsPage() {
  const data = await getSourceData();

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <a
          href="/"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to Newton Development
        </a>

        <div className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Explore
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Development projects
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Search and browse development projects and other matters
            tracked by Newton Development.
          </p>
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Official Newton source
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {data.projectCount} projects currently collected
              </p>
            </div>

            <a
              href={data.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold underline underline-offset-4"
            >
              View City source
            </a>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">
                Projects
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Last collected{" "}
                {new Date(data.fetchedAt).toLocaleString()}
              </p>
            </div>

            <p className="text-sm text-slate-500">
              {data.projectCount} projects
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {data.projects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-slate-200 p-6"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
                    {project.status}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-semibold">
                  {project.name}
                </h3>

                <p className="mt-3 leading-6 text-slate-700">
                  {project.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-4">
                  <a
                    href={`/projects/${project.id}`}
                    className="text-sm font-semibold underline underline-offset-4"
                  >
                    View project
                  </a>

                  {project.links?.map((link) => (
                    <a
                      key={`${project.id}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold underline underline-offset-4"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}