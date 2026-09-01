const projects = [
  {
    name: "Example Development Project",
    location: "Newton, Massachusetts",
    status: "Under Review",
    type: "Housing",
  },
  {
    name: "Example Commercial Project",
    location: "Newton Centre",
    status: "Proposed",
    type: "Commercial",
  },
  {
    name: "Example Zoning Matter",
    location: "Auburndale",
    status: "Scheduled for Hearing",
    type: "Zoning",
  },
];

const villages = [
  "Auburndale",
  "Chestnut Hill",
  "Newton Centre",
  "Newton Corner",
  "Newton Highlands",
  "Newton Lower Falls",
  "Newton Upper Falls",
  "Newtonville",
  "Nonantum",
  "Oak Hill",
  "Thompsonville",
  "Waban",
  "West Newton",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Newton Development
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Understanding what is proposed, reviewed, approved, and built in Newton.
            </p>
          </div>

          <nav className="hidden gap-6 text-sm font-medium md:flex">
            <a href="#projects" className="hover:text-slate-600">
              Projects
            </a>
            <a href="#villages" className="hover:text-slate-600">
              Villages
            </a>
            <a href="#hearings" className="hover:text-slate-600">
              Hearings
            </a>
            <a href="#about" className="hover:text-slate-600">
              About
            </a>
          </nav>
        </div>
      </header>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-600">
              An independent resident resource
            </p>

            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              What is changing in Newton?
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              A plain-English guide to development proposals, zoning matters,
              public hearings, and projects across Newton, Massachusetts.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#projects"
                className="rounded-lg bg-slate-900 px-6 py-3 text-center font-semibold text-white hover:bg-slate-700"
              >
                Browse projects
              </a>

              <a
                href="#villages"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-center font-semibold hover:bg-slate-100"
              >
                Browse by village
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              Plain English
            </p>
            <p className="mt-1 text-slate-700">
              Government processes explained without unnecessary jargon.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-500">
              Official sources
            </p>
            <p className="mt-1 text-slate-700">
              Facts are linked back to the City records they came from.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-500">
              No advocacy
            </p>
            <p className="mt-1 text-slate-700">
              The site organizes information without taking positions.
            </p>
          </div>
        </div>
      </section>

      <section id="projects" className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Explore
            </p>
            <h2 className="mt-2 text-3xl font-bold">Development projects</h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Search and browse projects by location, type, or current status.
            </p>
          </div>

          <button className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50">
            Search projects
          </button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.name}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                  {project.status}
                </span>

                <span className="text-xs text-slate-500">
                  {project.type}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-semibold">{project.name}</h3>

              <p className="mt-2 text-sm text-slate-600">
                {project.location}
              </p>

              <button className="mt-6 text-sm font-semibold underline underline-offset-4">
                View project
              </button>
            </article>
          ))}
        </div>
      </section>

      <section id="villages" className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Browse by location
          </p>

          <h2 className="mt-2 text-3xl font-bold">Newton's villages</h2>

          <p className="mt-3 max-w-2xl text-slate-600">
            See development activity organized around the places residents
            already know.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {villages.map((village) => (
              <button
                key={village}
                className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-left font-medium hover:border-slate-400 hover:bg-slate-50"
              >
                {village}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="hearings" className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Public process
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Upcoming public hearings
          </h2>

          <p className="mt-4 max-w-2xl text-slate-600">
            Future versions of this page will connect official City meeting
            postings with the projects they concern.
          </p>

          <div className="mt-6 rounded-lg bg-slate-50 p-5 text-sm text-slate-600">
            No hearings have been added yet. This is intentionally empty until
            information has been verified against an official source.
          </div>
        </div>
      </section>

      <section id="about" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-2xl font-bold">About this site</h2>

          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            Newton Development is an independent resident-facing information
            resource. It is not affiliated with or endorsed by the City of
            Newton. The site organizes and explains public information while
            linking residents back to the City's original records.
          </p>

          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            Information is intended to be factual and traceable. When the
            available official record does not establish something clearly,
            this site will not guess.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-slate-500">
          <p>
            Independent resident resource. Not affiliated with or endorsed by
            the City of Newton.
          </p>
        </div>
      </footer>
    </main>
  );
}