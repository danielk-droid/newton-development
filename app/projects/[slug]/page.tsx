import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectStatusBadge from "../../components/ProjectStatusBadge";
import { allProjects } from "../../../data/project-catalog";
import eventCollectionStatus from "../../../data/event-collection-status.json";
import { projectEvents, type ProjectEvent } from "../../../data/project-events";

function formatDate(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }
function formatDateTime(date: string) { return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }

function getStatusDescription(status: string) {
  switch (status) {
    case "Proposed": return "The project has been proposed but has not yet been formally submitted.";
    case "Submitted": return "The project has been formally submitted to the City for review.";
    case "Under Review": return "The project is currently undergoing municipal review.";
    case "Scheduled for Hearing": return "A public hearing or formal hearing process has been scheduled.";
    case "Approved": return "The project has received approval.";
    case "Approved with Conditions": return "The project has been approved subject to specified conditions.";
    case "Under Construction": return "Construction is currently underway.";
    case "Completed": return "The project has been completed.";
    case "Denied": return "The project was denied.";
    case "Appealed": return "The project decision or approval has been appealed.";
    case "Withdrawn": return "The project application has been withdrawn.";
    case "Cancelled": return "The project has been cancelled.";
    default: return "The current status could not be classified.";
  }
}

function getLifecycleStages(type: string) { return type === "Transportation" || type === "Public Building" ? ["Planning", "Design", "Funding / Approval", "Under Construction", "Completed"] : ["Proposed", "Submitted", "Under Review", "Scheduled for Hearing", "Approved", "Under Construction", "Completed"]; }
function getCurrentStageIndex(type: string, status: string) {
  if (type === "Transportation" || type === "Public Building") {
    switch (status) { case "Completed": return 4; case "Under Construction": return 3; case "Approved": case "Approved with Conditions": return 2; case "Submitted": case "Under Review": case "Scheduled for Hearing": return 1; default: return 0; }
  }
  switch (status) { case "Completed": return 6; case "Under Construction": return 5; case "Approved": case "Approved with Conditions": return 4; case "Scheduled for Hearing": return 3; case "Under Review": return 2; case "Submitted": return 1; case "Proposed": return 0; default: return -1; }
}
function getEventTypeLabel(type: ProjectEvent["type"]) { switch (type) { case "Hearing": return "Public hearing"; case "Meeting": return "Meeting"; case "Decision": return "Decision"; case "Application": return "Application"; case "Notice": return "Notice"; case "Construction": return "Construction"; default: return "Project event"; } }
function sortEvents(events: ProjectEvent[]) { return [...events].sort((a, b) => new Date(`${a.date}T12:00:00`).getTime() - new Date(`${b.date}T12:00:00`).getTime()); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = allProjects.find((item) => item.id === slug);
  return project ? { title: project.name, description: `${project.name} — status, verified project facts, events, and official source records in Newton, Massachusetts.` } : { title: "Project not found" };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = allProjects.find((item) => item.id === slug);
  if (!project) notFound();

  const lifecycleStages = getLifecycleStages(project.type);
  const currentStageIndex = getCurrentStageIndex(project.type, project.status);
  const events = sortEvents(projectEvents.filter((event) => event.projectId === project.id && event.verified === true));
  const now = new Date();
  const upcomingEvents = events.filter((event) => new Date(`${event.date}T23:59:59`) >= now);
  const pastEvents = events.filter((event) => new Date(`${event.date}T23:59:59`) < now);
  const nextOpportunity = upcomingEvents.find((event) => Boolean(event.participationUrl)) ?? null;
  const isPublicProject = project.type === "Public Building" || project.type === "Transportation";
  const highlights = project.highlights ?? [];
  const successfulEventSources = Number(eventCollectionStatus.successfulSources ?? 0);
  const failedEventSources = Number(eventCollectionStatus.failedSources ?? 0);
  const eventCheckDate = eventCollectionStatus.checkedAt;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 md:py-12">
        <Link href="/projects" className="inline-flex items-center rounded-lg px-1 py-1 text-sm font-bold text-slate-600 transition hover:text-slate-950">← Back to projects</Link>

        <header className="relative mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white px-7 py-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:px-9 md:py-10">
          <div className="absolute right-[-5rem] top-[-5rem] h-56 w-56 rounded-full bg-sky-50" aria-hidden="true" />
          <div className="relative"><div className="flex flex-wrap items-center gap-2"><ProjectStatusBadge status={project.status} /><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600">{project.type}</span>{project.village !== "Unknown" && <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600">{project.village}</span>}</div>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-[-0.045em] text-slate-950 md:text-5xl">{project.name}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">{project.description}</p>
            {project.address && <p className="mt-5 inline-flex rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{project.address}</p>}
            <p className="mt-5 text-xs font-medium text-slate-500">Project data checked {formatDateTime(project.lastUpdated)}</p>
          </div>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]" aria-labelledby="status-heading">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current status</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="status-heading" className="text-2xl font-bold tracking-tight">{project.status}</h2><p className="mt-1 text-slate-600">{getStatusDescription(project.status)}</p></div><ProjectStatusBadge status={project.status} size="sm" /></div>
        </section>

        {highlights.length > 0 && <section className="mt-10" aria-labelledby="facts-heading"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{isPublicProject ? "Verified project facts" : "Verified development facts"}</p><h2 id="facts-heading" className="mt-2 text-3xl font-bold tracking-[-0.03em]">At a glance</h2><div className={`mt-6 grid gap-4 ${highlights.length === 1 ? "max-w-sm" : highlights.length === 2 ? "sm:grid-cols-2" : highlights.length === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>{highlights.map((fact) => <div key={`${fact.label}-${fact.value}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"><p className="text-sm font-medium text-slate-500">{fact.label}</p><p className="mt-2 text-xl font-bold leading-tight text-slate-950">{fact.value}</p><a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-xs font-bold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">Source ↗</a></div>)}</div></section>}

        <section className="mt-10" aria-labelledby="opportunity-heading"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Next opportunity</p><h2 id="opportunity-heading" className="mt-2 text-3xl font-bold tracking-[-0.03em]">Participate in the process</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Upcoming public opportunities are shown when an official City record connects them to this project.</p>{nextOpportunity ? <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[var(--brand)] px-3 py-1 text-sm font-bold text-white">{getEventTypeLabel(nextOpportunity.type)}</span><span className="text-sm font-semibold text-slate-500">{formatDate(nextOpportunity.date)}</span></div><h3 className="mt-4 text-2xl font-bold tracking-tight">{nextOpportunity.title}</h3><p className="mt-3 max-w-2xl leading-7 text-slate-600">{nextOpportunity.description}</p><div className="mt-6 flex flex-col gap-3 sm:flex-row">{nextOpportunity.participationUrl && <a href={nextOpportunity.participationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--brand-strong)]">Participation information <span aria-hidden="true" className="ml-2">↗</span></a>}<a href={nextOpportunity.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50">Official record <span aria-hidden="true" className="ml-2">↗</span></a></div></div> : <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"><h3 className="text-xl font-bold">{successfulEventSources > 0 ? "No upcoming project-specific activity found" : "Upcoming activity data is not available yet"}</h3><p className="mt-2 max-w-2xl leading-7 text-slate-600">{successfulEventSources > 0 ? `No upcoming project-specific public meeting, hearing, or notice was identified in the official records checked by Newton Development${eventCheckDate ? ` as of ${formatDateTime(eventCheckDate)}` : ""}.` : "The official event sources have not yet completed a successful check. Check the City calendar for current meeting information."}</p>{failedEventSources > 0 && successfulEventSources > 0 && <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-800">Some official event sources could not be checked during the latest update, so this does not represent a complete City-wide absence of upcoming activity.</p>}<a href="https://www.newtonma.gov/government/city-clerk/city-council/calendar-news/calendar" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center text-sm font-bold underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">Check the City calendar <span aria-hidden="true" className="ml-2">↗</span></a></div>}</section>

        <section className="mt-10" aria-labelledby="lifecycle-heading"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Project progress</p><h2 id="lifecycle-heading" className="mt-2 text-3xl font-bold tracking-[-0.03em]">{isPublicProject ? "Project lifecycle" : "Development process"}</h2><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-7"><ol className="relative ml-2 border-l-2 border-slate-200">{lifecycleStages.map((stage, index) => { const isCompleted = currentStageIndex >= 0 && index < currentStageIndex; const isCurrent = currentStageIndex === index; const isFuture = !isCompleted && !isCurrent; return <li key={stage} className="relative pl-8 pb-8 last:pb-0"><span className={`absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white shadow-sm ${isCurrent ? "border-[var(--brand)] ring-4 ring-slate-100" : isCompleted ? "border-[var(--brand)] bg-[var(--brand)]" : "border-slate-300"}`} aria-hidden="true">{isCompleted ? <span className="text-[10px] font-bold text-white">✓</span> : isCurrent ? <span className="h-2 w-2 rounded-full bg-[var(--brand)]" /> : null}</span><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><p className={`text-base font-semibold ${isCurrent ? "text-slate-950" : isCompleted ? "text-slate-700" : "text-slate-400"}`}>{stage}</p>{isCurrent && <p className="mt-1 text-sm font-medium text-slate-500">Current stage</p>}{isFuture && <p className="mt-1 text-sm text-slate-400">Not yet reached</p>}</div>{isCurrent && <span className="inline-flex w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">Current stage</span>}</div></li>; })}</ol></div></section>

        <section className="mt-10" aria-labelledby="records-heading"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Verified records</p><h2 id="records-heading" className="mt-2 text-3xl font-bold tracking-[-0.03em]">What has happened</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Dated events are linked to official City records.</p>{pastEvents.length > 0 ? <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"><div className="divide-y divide-slate-200">{[...pastEvents].reverse().map((event) => <div key={event.id} className="p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{getEventTypeLabel(event.type)}</span><h3 className="mt-2 text-xl font-bold text-slate-950">{event.title}</h3></div><p className="shrink-0 text-sm font-semibold text-slate-500">{formatDate(event.date)}</p></div><p className="mt-3 max-w-3xl leading-7 text-slate-600">{event.description}</p><a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-bold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950">View official record <span aria-hidden="true" className="ml-2">↗</span></a></div>)}</div></div> : <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="font-semibold">No verified historical records have been added yet.</p><p className="mt-2 text-sm leading-6 text-slate-600">Dated events are added when they can be tied to an official City record.</p></div>}</section>

        <section className="mt-10" aria-labelledby="sources-heading"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Official sources</p><h2 id="sources-heading" className="mt-2 text-3xl font-bold tracking-[-0.03em]">Source records</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Review the official public records used for this project.</p><div className="mt-6 grid gap-3">{project.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-md"><div className="flex items-center justify-between gap-4"><p className="font-bold text-slate-950">{link.label}</p><span className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" aria-hidden="true">↗</span></div></a>)}</div></section>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-500">Project information is assembled from official public records. Statuses and events may change as agencies publish new information.</footer>
      </div>
    </main>
  );
}
