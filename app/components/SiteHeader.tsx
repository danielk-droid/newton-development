import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="Newton Development home">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-extrabold text-white shadow-sm transition group-hover:bg-[var(--brand-strong)]">N</span>
          <span className="truncate text-[15px] font-bold tracking-[-0.01em] text-slate-950">Newton Development</span>
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-0.5 sm:gap-1">
          <Link href="/projects" className="rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:px-3.5">Projects</Link>
          <Link href="/map" className="rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:px-3.5">Map</Link>
          <Link href="/map" className="ml-1 hidden items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-strong)] hover:shadow-md md:inline-flex">
            <span aria-hidden="true" className="text-base">⌖</span>
            <span>Explore map</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
