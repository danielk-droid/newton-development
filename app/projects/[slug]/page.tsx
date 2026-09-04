import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import {
  projectEvents,
  type ProjectEvent,
} from "../../../data/project-events";

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
  rawStatus: string;
  village?: string;
  links: {
    label: string;
    url: string;
  }[];
  facts?: ProjectFacts;
  sourceUrl: string;
  lastSeen: string;
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

  const file = await fs.readFile(
    filePath,
    "utf8"
  );

  return JSON.parse(file);
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "—";
  }

  return value.toLocaleString();
}

function formatDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );
}

function getFacts(project: Project): ProjectFacts {
  const description = project.description ?? "";

  const affordableMatch = description.match(
    /\b(\d[\d,]*)\s+(?:units?\s+)?designated\s+as\s+affordable\b/i
  );

  const affordableUnits =
    project.facts?.affordableUnits ??
    (affordableMatch
      ? Number(
          affordableMatch[1].replace(/,/g, "")
        )
      : null);

  return {
    units: project.facts?.units ?? null,
    affordableUnits,
    stories: project.facts?.stories ?? null,
    parkingSpaces:
      project.facts?.parkingSpaces ?? null,
  };
}

function getStatusDescription(status: string) {
  switch (status) {
    case "Proposed":
      return "The project has been proposed but has not yet been formally submitted.";

    case "Submitted":
      return "The project has been formally submitted to the City for review.";

    case "Under Review":
      return "The project is currently undergoing municipal review.";

    case "Scheduled for Hearing":
      return "A public hearing or formal hearing process has been scheduled.";

    case "Approved":
      return "The project has received approval.";

    case "Approved with Conditions":
      return "The project has been approved subject to specified conditions.";

    case "Under Construction":
      return "Construction is currently underway.";

    case "Completed":
      return "The project has been completed.";

    case "Denied":
      return "The project was denied.";

    case "Appealed":
      return "The project's decision or approval has been appealed.";

    case "Withdrawn":
      return "The project application has been withdrawn.";

    case "Cancelled":
      return "The project has been cancelled.";

    default:
      return "The current status could not be classified.";
  }
}

const mainStages = [
  "Proposed",
  "Submitted",
  "Under Review",
  "Scheduled for Hearing",
  "Approved",
  "Under Construction",
  "Completed",
];

function getEventTypeLabel(
  type: ProjectEvent["type"]
) {
  switch (type) {
    case "Hearing":
      return "Public hearing";

    case "Meeting":
      return "Meeting";

    case "Decision":
      return "Decision";

    case "Application":
      return "Application";

    case "Notice":
      return "Notice";

    case "Construction":
      return "Construction";

    default:
      return "Project event";
  }
}

function sortEvents(events: ProjectEvent[]) {
  return [...events].sort(
    (a, b) =>
      new Date(`${a.date}T12:00:00`).getTime() -
      new Date(`${b.date}T12:00:00`).getTime()
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await getSourceData();

  const project = data.projects.find(
    (item) => item.id === slug
  );

  if (!project) {
    notFound();
  }

  const facts = getFacts(project);

  const currentStageIndex = mainStages.indexOf(
    project.status
  );

  const events = sortEvents(
    projectEvents.filter(
      (event) =>
        event.projectId === project.id &&
        event.verified === true
    )
  );

  const now = new Date();

  const upcomingEvents = events.filter(
    (event) =>
      new Date(`${event.date}T23:59:59`) >= now
  );

  const pastEvents = events.filter(
    (event) =>
      new Date(`${event.date}T23:59:59`) < now
  );

  const nextOpportunity =
    upcomingEvents.find(
      (event) =>
        Boolean(event.participationUrl)
    ) ?? null;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          href="/projects"
          className="text-sm font-semibold underline underline-offset-4"
        >
          ← Back to projects
        </Link>

        <header className="mt-10">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
              {project.status}
            </span>

            {project.village &&
              project.village !== "Unknown" && (
                <span className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600">
                  {project.village}
                </span>
              )}
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight md:text-5xl">
            {project.name}
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            {project.description}
          </p>
        </header>

        <section className="mt-12">
          <div className="rounded-2xl border border-slate-200 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Current status
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {project.status}
                </h2>

                <p className="mt-1 text-slate-600">
                  {getStatusDescription(
                    project.status
                  )}
                </p>
              </div>

              <p className="text-sm text-slate-500">
                Last checked{" "}
                {formatDateTime(
                  project.lastSeen
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Next opportunity
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Participate in the process
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              We only show an upcoming opportunity when an
              official City record connects it to this project.
            </p>
          </div>

          {nextOpportunity ? (
            <div className="mt-8 rounded-2xl border border-slate-300 bg-slate-50 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                  {getEventTypeLabel(
                    nextOpportunity.type
                  )}
                </span>

                <span className="text-sm font-medium text-slate-500">
                  {formatDate(
                    nextOpportunity.date
                  )}
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-bold tracking-tight">
                {nextOpportunity.title}
              </h3>

              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                {nextOpportunity.description}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={
                    nextOpportunity.participationUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Participation information
                  <span
                    aria-hidden="true"
                    className="ml-2"
                  >
                    ↗
                  </span>
                </a>

                <a
                  href={nextOpportunity.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                >
                  Official record
                  <span
                    aria-hidden="true"
                    className="ml-2"
                  >
                    ↗
                  </span>
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold">
                No verified upcoming opportunity
              </h3>

              <p className="mt-2 max-w-2xl leading-7 text-slate-600">
                We have not identified an upcoming public
                meeting, hearing, or other participation
                opportunity that an official record currently
                connects to this project.
              </p>

              <a
                href="https://www.newtonma.gov/government/city-clerk/city-council/calendar-news/calendar"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center text-sm font-semibold underline underline-offset-4"
              >
                Check the City calendar
                <span
                  aria-hidden="true"
                  className="ml-2"
                >
                  ↗
                </span>
              </a>
            </div>
          )}
        </section>

        <section className="mt-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Project timeline
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Development process
            </h2>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 p-6">
            <div className="space-y-6">
              {mainStages.map((stage, index) => {
                const isCompleted =
                  currentStageIndex >= 0 &&
                  index < currentStageIndex;

                const isCurrent =
                  currentStageIndex === index;

                return (
                  <div
                    key={stage}
                    className="flex items-start gap-4"
                  >
                    <div
                      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isCompleted || isCurrent
                          ? "bg-slate-900 text-white"
                          : "border border-slate-300 text-slate-400"
                      }`}
                    >
                      {isCompleted
                        ? "✓"
                        : index + 1}
                    </div>

                    <div>
                      <p
                        className={`font-semibold ${
                          isCurrent
                            ? "text-slate-900"
                            : isCompleted
                              ? "text-slate-700"
                              : "text-slate-400"
                        }`}
                      >
                        {stage}

                        {isCurrent && (
                          <span className="ml-2 text-sm font-medium text-slate-500">
                            Current stage
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Verified records
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              What has happened
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              These events come from official City records.
              Collection dates are not presented as historical
              event dates.
            </p>
          </div>

          {pastEvents.length > 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-200">
              <div className="divide-y divide-slate-200">
                {[...pastEvents]
                  .reverse()
                  .map((event) => (
                    <div
                      key={event.id}
                      className="p-6"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {getEventTypeLabel(
                              event.type
                            )}
                          </span>

                          <h3 className="mt-2 text-xl font-bold">
                            {event.title}
                          </h3>
                        </div>

                        <p className="shrink-0 text-sm font-medium text-slate-500">
                          {formatDate(event.date)}
                        </p>
                      </div>

                      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                        {event.description}
                      </p>

                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex text-sm font-semibold underline underline-offset-4"
                      >
                        View official record
                        <span
                          aria-hidden="true"
                          className="ml-2"
                        >
                          ↗
                        </span>
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-slate-200 p-6">
              <p className="font-semibold">
                No verified historical records have been added yet.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                We are adding dated events only when they can
                be tied to an official City record.
              </p>
            </div>
          )}
        </section>

        <section className="mt-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Project facts
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              At a glance
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500">
                Residential units
              </p>

              <p className="mt-2 text-3xl font-bold">
                {formatNumber(facts.units)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500">
                Affordable units
              </p>

              <p className="mt-2 text-3xl font-bold">
                {formatNumber(
                  facts.affordableUnits
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500">
                Stories
              </p>

              <p className="mt-2 text-3xl font-bold">
                {formatNumber(facts.stories)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <p className="text-sm font-medium text-slate-500">
                Parking spaces
              </p>

              <p className="mt-2 text-3xl font-bold">
                {formatNumber(
                  facts.parkingSpaces
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Official sources
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Verify the information
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Newton Development is an independent project
              and is not affiliated with the City of Newton.
              Use the official sources below to review the
              underlying records.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-slate-200 p-5 hover:bg-slate-50"
            >
              <p className="font-semibold">
                City development-project page
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Official City source used to collect this
                project's current status.
              </p>
            </a>

            {project.links.map((link) => (
              <a
                key={`${link.label}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-slate-200 p-5 hover:bg-slate-50"
              >
                <p className="font-semibold">
                  {link.label}
                </p>

                <p className="mt-1 break-all text-sm text-slate-600">
                  {link.url}
                </p>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <p className="text-sm font-semibold text-slate-900">
            Data provenance
          </p>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Current project information is collected from
            the City of Newton's public development-project
            listing. Historical events are added separately
            and are displayed only when they are tied to a
            verified official record.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Current collection:{" "}
            {formatDateTime(data.fetchedAt)}
          </p>
        </section>
      </div>
    </main>
  );
}