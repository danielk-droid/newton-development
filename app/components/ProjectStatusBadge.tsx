type ProjectStatusBadgeProps = {
  status: string;
  size?: "sm" | "md";
};

function statusTone(status: string) {
  switch (status) {
    case "Under Construction":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "Approved":
    case "Approved with Conditions":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "Completed":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "Submitted":
    case "Under Review":
    case "Scheduled for Hearing":
      return "border-blue-200 bg-blue-50 text-blue-900";
    case "Proposed":
      return "border-violet-200 bg-violet-50 text-violet-900";
    case "Appealed":
    case "Denied":
    case "Withdrawn":
    case "Cancelled":
      return "border-rose-200 bg-rose-50 text-rose-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function statusDot(status: string) {
  switch (status) {
    case "Under Construction": return "bg-amber-500";
    case "Approved":
    case "Approved with Conditions":
      return "bg-emerald-500";
    case "Completed": return "bg-slate-500";
    case "Submitted":
    case "Under Review":
    case "Scheduled for Hearing":
      return "bg-blue-500";
    case "Proposed": return "bg-violet-500";
    case "Appealed":
    case "Denied":
    case "Withdrawn":
    case "Cancelled":
      return "bg-rose-500";
    default: return "bg-slate-400";
  }
}

export default function ProjectStatusBadge({ status, size = "md" }: ProjectStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border font-semibold ${size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"} ${statusTone(status)}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${statusDot(status)}`} aria-hidden="true" />
      {status}
    </span>
  );
}
