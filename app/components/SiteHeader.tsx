import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Newton Development home">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">N</span>
          <span className="truncate text-sm font-bold tracking-tight text-slate-950 sm:text-base">Newton Development</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 sm:flex">
          <Link href="/projects" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">Projects</Link>
          <Link href="/map" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">Map</Link>
        </nav>

        <Link href="/map" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700">
          <span aria-hidden="true">⌖</span>
          <span className="hidden sm:inline">Explore map</span>
          <span className="sm:hidden">Map</span>
        </Link>
      </div>
    </header>
  );
}
