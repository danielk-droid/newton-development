import MapClient from "./MapClient";
import { allProjects } from "../../data/project-catalog";

export const metadata = {
  title: "Map",
  description: "Explore tracked Newton development projects by location, type, and status.",
  alternates: { canonical: "/map" },
};

export default function MapPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1500px] px-4 py-8 md:px-6 md:py-10">
        <header className="mb-7 flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Interactive map</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950 md:text-4xl">Where projects are happening</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Explore tracked development, public-building, and transportation projects across Newton. Mapped locations come from the City of Newton GIS address and street datasets.</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600"><span className="font-bold text-slate-900">Location source</span><br />City of Newton GIS</div>
        </header>
        <MapClient projects={allProjects} />
      </div>
    </main>
  );
}
