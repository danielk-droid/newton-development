import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";

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

const timelineStages = [
  "Proposed",
  "Submitted",
  "Under Review",
  "Scheduled for Hearing",
  "Approved",
  "Approved with Conditions",
  "Denied",
  "Withdrawn",
  "Appealed",
  "Under Construction",
  "Completed",
  "Cancelled",
];

function getTimelineStage(status: string): string {
  const normalized = status.toLowerCase();

  if (normalized.includes("denied")) {
    if (normalized.includes("appeal")) {
      return "Appealed";
    }

    return "Denied";
  }

  if (normalized.includes("withdrawn")) {
    return "Withdrawn";
  }

  if (
    normalized.includes("under construction") ||
    normalized.includes("construction")
  ) {
    return "Under Construction";
  }

  if (
    normalized.includes("complete") ||
    normalized.includes("completed")
  ) {
    return "Completed";
  }

  if (
    normalized.includes("approved with conditions") ||
    normalized.includes("approved with condition")
  ) {
    return "Approved with Conditions";
  }

  if (normalized.includes("approved")) {
    return "Approved";
  }

  if (
    normalized.includes("filed") ||
    normalized.includes("submitted")
  ) {
    return "Submitted";
  }

  if (normalized.includes("hearing")) {
    return "Scheduled for Hearing";
  }

  if (
    normalized.includes("review") ||
    normalized.includes("committee")
  ) {
    return "Under Review";
  }

  if (normalized.includes("proposed")) {
    return "Proposed";
  }

  return "Proposed";
}

async function getSourceData(): Promise<SourceData> {
  const filePath = path.join(
    process.cwd(),
    "data",
    "newton-source.json"
  );

  const file = await fs.readFile(filePath, "utf8");

  return JSON.parse(file);
}

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectPage({
  params,
}: ProjectPageProps) {
  const { slug } = await params;

  const data = await getSourceData();

  const project = data.projects.find(
    (item) => item.id === slug
  );

  if (!project) {
    notFound();
  }

  const currentStage = getTimelineStage(project.status);

  const currentStageIndex =
    timelineStages.indexOf(currentStage);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <a
          href="/projects"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to projects
        </a>

        <div className="mt-8">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
            {project.status}
          </span>

          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            {project.name}
          </h1>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">
            The short version
          </h2>

          <p className="mt-3 leading-7 text-slate-700">
            {project.description}
          </p>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-2xl font-semibold">
            Where it stands
          </h2>

          <p className="mt-3 text-slate-700">
            Current status:{" "}
            <strong>{project.status}</strong>
          </p>

          <div className="mt-8">
            <div className="space-y-4">
              {timelineStages.map((stage, index) => {
                const isCurrent =
                  stage === currentStage;

                const isPast =
                  currentStageIndex >= 0 &&
                  index < currentStageIndex;

                return (
                  <div
                    key={stage}
                    className="flex items-start gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                          isCurrent
                            ? "border-slate-900 bg-slate-900 text-white"
                            : isPast
                              ? "border-slate-500 bg-slate-100 text-slate-700"
                              : "border-slate-300 bg-white text-slate-400"
                        }`}
                      >
                        {isCurrent
                          ? "●"
                          : isPast
                            ? "✓"
                            : ""}
                      </div>

                      {index <
                        timelineStages.length - 1 && (
                        <div className="h-6 w-px bg-slate-300" />
                      )}
                    </div>

                    <div className="pt-1">
                      <p
                        className={`font-medium ${
                          isCurrent
                            ? "text-slate-900"
                            : isPast
                              ? "text-slate-700"
                              : "text-slate-400"
                        }`}
                      >
                        {stage}
                      </p>

                      {isCurrent && (
                        <p className="mt-1 text-sm text-slate-600">
                          Current standardized stage
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-2xl font-semibold">
            Official sources
          </h2>

          <p className="mt-3 text-sm text-slate-600">
            The current status wording above comes directly
            from the City of Newton source.
          </p>

          <a
            href={project.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-semibold underline underline-offset-4"
          >
            View official City source
          </a>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-500">
            Data collected:{" "}
            {new Date(data.fetchedAt).toLocaleString()}
          </p>
        </section>
      </div>
    </main>
  );
}