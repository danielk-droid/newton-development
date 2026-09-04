import MapClient from "./MapClient";
import { allProjects } from "../../data/project-catalog";

export const metadata = { title: "Map" };

export default function MapPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-[1500px] px-4 py-8 md:px-6 md:py-10">
        <header className="mb-7 border-b border-slate-200 pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Interactive map</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] md:text-4xl">Where projects are happening</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Explore tracked development, public-building, and transportation projects across Newton. Map locations are geocoded from the project addresses.</p>
        </header>
        <MapClient projects={allProjects} />
      </div>
    </main>
  );
}
