import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<JobStatus, string> = {
  PUBLISHED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  DRAFT: "bg-muted text-muted-foreground",
  ARCHIVED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}
