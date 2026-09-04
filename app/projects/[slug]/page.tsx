import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectStatusBadge from "../../components/ProjectStatusBadge";
import { allProjects } from "../../../data/project-catalog";
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
function getLifecycleStatus(type: string, status: string, stage: string) {
  if (type === "Transportation" || type === "Public Building") {
    if (status === "Completed") return stage === "Completed";
    if (status === "Under Construction") return stage === "Under Construction";
    if (["Approved", "Approved with Conditions"].includes(status)) return ["Planning", "Design", "Funding / Approval"].includes(stage);
    if (["Submitted", "Under Review", "Scheduled for Hearing"].includes(status)) return ["Planning", "Design"].includes(stage);
    return stage === "Planning";
  }
  return false;
}
function getEventTypeLabel(type: ProjectEvent["type"]) { switch (type) { case "Hearing": return "Public hearing"; case "Meeting": return "Meeting"; case "Decision": return "Decision"; case "Application": return "Application"; case "Notice": return "Notice"; case "Construction": return "Construction"; default: return "Project event"; } }
function sortEvents(events: ProjectEvent[]) { return [...events].sort((a, b) => new Date(`${a.date}T12:00:00`).getTime() - new Date(`${b.date}T12:00:00`).getTime()); }

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = allProjects.find((item) => item.id === slug);
  if (!project) notFound();

  const lifecycleStages = getLifecycleStages(project.type);
  const currentStageIndex = lifecycleStages.findIndex((stage) => getLifecycleStatus(project.type, project.status, stage));
  const events = sortEvents(projectEvents.filter((event) => event.projectId === project.id && event.verified === true));
  const now = new Date();
  const upcomingEvents = events.filter((event) => new Date(`${event.date}T23:59:59`) >= now);
  const pastEvents = events.filter((event) => new Date(`${event.date}T23:59:59`) < now);
  const nextOpportunity = upcomingEvents.find((event) => Boolean(event.participationUrl)) ?? null;
  const isPrivateDevelopment = ["Housing", "Mixed-Use", "Commercial"].includes(project.type);
  const isPublicProject = project.type === "Public Building" || project.type === "Transportation";
  const highlights = project.highlights ?? [];
  const highlightHeading = project.type === "Transportation" ? "What is changing" : project.type === "Public Building" ? "Project at a glance" : "At a glance";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 md:py-14">
        <Link href="/projects" className="inline-flex items-center text-sm font-semibold text-slate-600 transition hover:text-slate-950">← Back to projects</Link>

        <header className="mt-8 border-b border-slate-200 pb-10">
          <div className="flex flex-wrap items-center gap-2"><ProjectStatusBadge status={project.status} /><span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600">{project.type}</span>{project.village !== "Unknown" && <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600">{project.village}</span>}</div>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-[-0.03em] md:text-5xl">{project.name}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{project.description}</p>
          <p className="mt-5 text-sm text-slate-500">Last checked {formatDateTime(project.lastUpdated)}</p>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Current status</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold tracking-tight">{project.status}</h2><p className="mt-1 text-slate-600">{getStatusDescription(project.status)}</p></div><ProjectStatusBadge status={project.status} size="sm" /></div>
        </section>

        {highlights.length > 0 && <section className="mt-10"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Verified project facts</p><h2 className="mt-2 text-3xl font-bold tracking-tight">{highlightHeading}</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{highlights.map((fact) => <div key={`${fact.label}-${fact.value}`} className={`rounded-2xl border p-6 ${project.type === "Transportation" ? "border-cyan-100 bg-cyan-50/60" : project.type === "Public Building" ? "border-indigo-100 bg-indigo-50/60" : "border-slate-200 bg-white"}`}><p className="text-sm font-medium text-slate-500">{fact.label}</p><p className="mt-2 text-xl font-bold leading-tight">{fact.value}</p><a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-xs font-semibold text-slate-600 underline underline-offset-4">Source ↗</a></div>)}</div></section>}

        <section className="mt-10"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Next opportunity</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Participate in the process</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Upcoming public opportunities are shown when an official City record connects them to this project.</p></div>{nextOpportunity ? <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">{getEventTypeLabel(nextOpportunity.type)}</span><span className="text-sm font-medium text-slate-500">{formatDate(nextOpportunity.date)}</span></div><h3 className="mt-4 text-2xl font-bold tracking-tight">{nextOpportunity.title}</h3><p className="mt-3 max-w-2xl leading-7 text-slate-600">{nextOpportunity.description}</p><div className="mt-6 flex flex-col gap-3 sm:flex-row">{nextOpportunity.participationUrl && <a href={nextOpportunity.participationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Participation information <span aria-hidden="true" className="ml-2">↗</span></a>}<a href={nextOpportunity.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100">Official record <span aria-hidden="true" className="ml-2">↗</span></a></div></div> : <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-xl font-bold">No verified upcoming opportunity</h3><p className="mt-2 max-w-2xl leading-7 text-slate-600">No upcoming public meeting, hearing, or other participation opportunity is currently connected to this project by an official City record.</p><a href="https://www.newtonma.gov/government/city-clerk/city-council/calendar-news/calendar" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center text-sm font-semibold underline underline-offset-4">Check the City calendar <span aria-hidden="true" className="ml-2">↗</span></a></div>}</section>

        <section className="mt-10"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Project progress</p><h2 className="mt-2 text-3xl font-bold tracking-tight">{isPublicProject ? "Project lifecycle" : "Development process"}</h2><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="space-y-6">{lifecycleStages.map((stage, index) => { const isCompleted = currentStageIndex >= 0 && index < currentStageIndex; const isCurrent = currentStageIndex === index; return <div key={stage} className="flex items-start gap-4"><div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isCompleted || isCurrent ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-400"}`}>{isCompleted ? "✓" : index + 1}</div><p className={`font-semibold ${isCurrent ? "text-slate-900" : isCompleted ? "text-slate-700" : "text-slate-400"}`}>{stage}{isCurrent && <span className="ml-2 text-sm font-medium text-slate-500">Current stage</span>}</p></div>; })}</div></div></section>

        <section className="mt-10"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Verified records</p><h2 className="mt-2 text-3xl font-bold tracking-tight">What has happened</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Dated events are linked to official City records.</p>{pastEvents.length > 0 ? <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="divide-y divide-slate-200">{[...pastEvents].reverse().map((event) => <div key={event.id} className="p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{getEventTypeLabel(event.type)}</span><h3 className="mt-2 text-xl font-bold">{event.title}</h3></div><p className="shrink-0 text-sm font-medium text-slate-500">{formatDate(event.date)}</p></div><p className="mt-3 max-w-3xl leading-7 text-slate-600">{event.description}</p><a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-semibold underline underline-offset-4">View official record <span aria-hidden="true" className="ml-2">↗</span></a></div>)}</div></div> : <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="font-semibold">No verified historical records have been added yet.</p><p className="mt-2 text-sm leading-6 text-slate-600">Dated events are added when they can be tied to an official City record.</p></div>}</section>

        {isPrivateDevelopment && <section className="mt-10"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Development facts</p><h2 className="mt-2 text-3xl font-bold tracking-tight">At a glance</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Residential units", project.facts.units], ["Affordable units", project.facts.affordableUnits], ["Stories", project.facts.stories], ["Parking spaces", project.facts.parkingSpaces]].map(([label, value]) => <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-medium text-slate-500">{label as string}</p><p className="mt-2 text-3xl font-bold">{value === null ? "—" : (value as number).toLocaleString()}</p></div>)}</div></section>}

        <section className="mt-10"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Official sources</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Source records</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Review the official public records used for this project.</p><div className="mt-6 space-y-3">{project.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"><p className="font-semibold">{link.label} <span aria-hidden="true">↗</span></p><p className="mt-1 break-all text-sm text-slate-500">{link.url}</p></a>)}</div></section>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-500">Project information is assembled from official public records. Statuses and events may change as agencies publish new information.</footer>
      </div>
    </main>
  );
}
