import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

import type { JobRecord } from "@/lib/data";
import { EMPLOYMENT_TYPE_LABELS, LOCATION_TYPE_LABELS } from "@/lib/schemas/enums";

export function JobCard({ job }: { job: JobRecord }) {
  return (
    <Link
      href={`/careers/${job.slug}`}
      className="group flex flex-col rounded-xl border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium leading-snug group-hover:text-primary">{job.title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{job.department}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium whitespace-nowrap">
          {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
        </span>
      </div>

      <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-4" />
        {job.location} · {LOCATION_TYPE_LABELS[job.locationType]}
      </p>

      {job.requiredSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.requiredSkills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-muted-foreground">
          {job.openings} opening{job.openings === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1 font-medium text-primary">
          View &amp; apply
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
