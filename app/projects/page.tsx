"use client";

import { useMemo, useState } from "react";
import { projects } from "@/data/projects";

const statuses = ["All", ...new Set(projects.map((project) => project.status))];
const types = ["All", ...new Set(projects.map((project) => project.type))];
const villages = ["All", ...new Set(projects.map((project) => project.village))];

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");
  const [village, setVillage] = useState("All");

  const filteredProjects = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    return projects.filter((project) => {
      const matchesSearch =
        searchTerm === "" ||
        project.name.toLowerCase().includes(searchTerm) ||
        project.address.toLowerCase().includes(searchTerm) ||
        project.village.toLowerCase().includes(searchTerm) ||
        project.type.toLowerCase().includes(searchTerm);

      const matchesStatus = status === "All" || project.status === status;
      const matchesType = type === "All" || project.type === type;
      const matchesVillage = village === "All" || project.village === village;

      return matchesSearch && matchesStatus && matchesType && matchesVillage;
    });
  }, [search, status, type, village]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <a
          href="/"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Back to Newton Development
        </a>

        <header className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Explore
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Development projects
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Search and browse development proposals and other matters tracked
            by Newton Development.
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label
                htmlFor="project-search"
                className="block text-sm font-semibold"
              >
                Search projects
              </label>

              <input
                id="project-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, address, village, or type"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-semibold"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
              >
                {statuses.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="type-filter"
                className="block text-sm font-semibold"
              >
                Type
              </label>

              <select
                id="type-filter"
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
              >
                {types.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="village-filter"
                className="block text-sm font-semibold"
              >
                Village
              </label>

              <select
                id="village-filter"
                value={village}
                onChange={(event) => setVillage(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
              >
                {villages.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Projects</h2>

            <p className="text-sm text-slate-500">
              {filteredProjects.length}{" "}
              {filteredProjects.length === 1 ? "project" : "projects"}
            </p>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <h3 className="text-lg font-semibold">No projects found</h3>
              <p className="mt-2 text-slate-600">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {filteredProjects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-2xl border border-slate-200 p-6"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                      {project.status}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                      {project.type}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-semibold">
                    {project.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    {project.address} · {project.village}
                  </p>

                  <p className="mt-4 leading-6 text-slate-700">
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
          )}
        </section>
      </div>
    </main>
  );
}