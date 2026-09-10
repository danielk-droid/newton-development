"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-[calc(100vh-68px)] px-5 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">This page could not be loaded.</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">The problem may be temporary. Try loading the page again, or return to the project directory.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => reset()} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--brand-strong)]">
            Try again
          </button>
          <a href="/projects" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50">
            Browse projects
          </a>
        </div>
      </div>
    </main>
  );
}
