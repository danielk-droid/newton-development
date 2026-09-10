import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-68px)] px-5 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Project or page not found</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
          The page you requested does not exist or the project record may have moved. Return to the project directory to continue browsing.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/projects" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--brand-strong)]">
            Browse projects
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
