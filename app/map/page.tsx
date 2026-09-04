import MapClient from "./MapClient";
import { allProjects } from "../../data/project-catalog";

export default function MapPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-6 md:py-8">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Newton Development
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Project map
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Explore tracked development, public-building, and transportation projects across Newton. Map locations are geocoded from the project addresses.
            </p>
          </div>
        </header>
        <MapClient projects={allProjects} />
      </div>
    </main>
  );
}
