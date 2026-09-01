import { notFound } from "next/navigation";
import { projects } from "@/data/projects";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;

  const project = projects.find((item) => item.id === slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <a
          href="/"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to Newton Development
        </a>

        <div className="mt-8">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
              {project.status}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
              {project.type}
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            {project.name}
          </h1>

          <p className="mt-2 text-lg text-slate-600">
            {project.address} · {project.village}
          </p>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">The short version</h2>
          <p className="mt-3 leading-7 text-slate-700">
            {project.description}
          </p>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-2xl font-semibold">Where it stands</h2>
          <p className="mt-3 text-slate-700">
            Current status: <strong>{project.status}</strong>
          </p>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-2xl font-semibold">Official sources</h2>
          <p className="mt-3 text-slate-700">
            This placeholder project has not yet been connected to an official
            City source.
          </p>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-500">
            Last updated: {project.lastUpdated}
          </p>
        </section>
      </div>
    </main>
  );
}