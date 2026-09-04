"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

type ProjectsClientProps = {
  projects: Project[];
};

const statusOrder = [
  "Under Construction",
  "Approved",
  "Approved with Conditions",
  "Scheduled for Hearing",
  "Under Review",
  "Submitted",
  "Proposed",
  "Completed",
  "Appealed",
  "Denied",
  "Withdrawn",
  "Cancelled",
  "Unknown",
];

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

function formatNumber(value: number | null) {
  if (value === null) {
    return null;
  }

  return value.toLocaleString();
}

function getStatusDescription(status: string) {
  switch (status) {
    case "Under Construction":
      return "Construction is underway.";

    case "Approved":
    case "Approved with Conditions":
      return "The project has received approval.";

    case "Submitted":
      return "An application has been filed.";

    case "Under Review":
      return "The project is being reviewed.";

    case "Scheduled for Hearing":
      return "A public hearing is scheduled.";

    case "Completed":
      return "The project is complete.";

    case "Appealed":
      return "The project is under appeal.";

    case "Denied":
      return "The project has been denied.";

    case "Proposed":
      return "The project has been proposed.";

    default:
      return null;
  }
}

export default function ProjectsClient({
  projects,
}: ProjectsClientProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [village, setVillage] = useState("All");

  const villages = useMemo(() => {
    return Array.from(
      new Set(
        projects
          .map((project) => project.village)
          .filter(
            (value): value is string =>
              Boolean(value) && value !== "Unknown"
          )
      )
    ).sort();
  }, [projects]);

  const statuses = useMemo(() => {
    const availableStatuses = new Set(
      projects.map((project) => project.status)
    );

    return statusOrder.filter((item) =>
      availableStatuses.has(item)
    );
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects
      .filter((project) => {
        if (
          normalizedSearch &&
          ![
            project.name,
            project.description,
            project.village ?? "",
            project.status,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
        ) {
          return false;
        }

        if (status !== "All" && project.status !== status) {
          return false;
        }

        if (
          village !== "All" &&
          project.village !== village
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aIndex = statusOrder.indexOf(a.status);
        const bIndex = statusOrder.indexOf(b.status);

        const normalizedA =
          aIndex === -1 ? statusOrder.length : aIndex;
        const normalizedB =
          bIndex === -1 ? statusOrder.length : bIndex;

        if (normalizedA !== normalizedB) {
          return normalizedA - normalizedB;
        }

        return a.name.localeCompare(b.name);
      });
  }, [projects, search, status, village]);

  const hasFilters =
    search.trim() !== "" ||
    status !== "All" ||
    village !== "All";

  function clearFilters() {
    setSearch("");
    setStatus("All");
    setVillage("All");
  }

  return (
    <div>
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_210px_210px]">
          <div>
            <label
              htmlFor="project-search"
              className="text-sm font-semibold text-slate-900"
            >
              Search
            </label>

            <input
              id="project-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Name, address, village, or keyword"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="status-filter"
              className="text-sm font-semibold text-slate-900"
            >
              Status
            </label>

            <select
              id="status-filter"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="All">All statuses</option>

              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="village-filter"
              className="text-sm font-semibold text-slate-900"
            >
              Village
            </label>

            <select
              id="village-filter"
              value={village}
              onChange={(event) =>
                setVillage(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="All">All villages</option>

              {villages.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {filteredProjects.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">
              {projects.length}
            </span>{" "}
            projects
          </p>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="self-start text-sm font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-950 sm:self-auto"
            >
              Clear filters
            </button>
          ) : (
            <p className="text-sm text-slate-500">
              Sorted by project status
            </p>
          )}
        </div>
      </section>

      {filteredProjects.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-slate-200 p-10 text-center">
          <h2 className="text-xl font-semibold">
            No projects found
          </h2>

          <p className="mt-2 text-slate-600">
            Try changing your search or filters.
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Clear filters
            </button>
          )}
        </section>
      ) : (
        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {filteredProjects.map((project) => {
            const units = formatNumber(
              project.facts?.units ?? null
            );

            const affordableUnits = formatNumber(
              project.facts?.affordableUnits ?? null
            );

            const stories = formatNumber(
              project.facts?.stories ?? null
            );

            const parkingSpaces = formatNumber(
              project.facts?.parkingSpaces ?? null
            );

            const factItems = [
              units !== null
                ? {
                    label: "Units",
                    value: units,
                  }
                : null,
              affordableUnits !== null
                ? {
                    label: "Affordable",
                    value: affordableUnits,
                  }
                : null,
              stories !== null
                ? {
                    label: "Stories",
                    value: stories,
                  }
                : null,
              parkingSpaces !== null
                ? {
                    label: "Parking",
                    value: parkingSpaces,
                  }
                : null,
            ].filter(
              (
                item
              ): item is {
                label: string;
                value: string;
              } => item !== null
            );

            const statusDescription =
              getStatusDescription(project.status);

            return (
              <article
                key={project.id}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2">
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

                <h2 className="mt-5 text-2xl font-bold leading-tight tracking-tight">
                  {project.name}
                </h2>

                <p className="mt-3 line-clamp-4 leading-7 text-slate-600">
                  {project.description}
                </p>

                {statusDescription && (
                  <p className="mt-4 text-sm font-medium text-slate-500">
                    {statusDescription}
                  </p>
                )}

                {factItems.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
                    {factItems.map((fact) => (
                      <div
                        key={fact.label}
                        className="bg-slate-50 px-3 py-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {fact.label}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {fact.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-6">
                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    View project
                    <span
                      aria-hidden="true"
                      className="ml-2 transition-transform group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}