"use client";

import { Check, MapPin } from "lucide-react";
import Link from "next/link";

import type { JobRecord } from "@/lib/data";
import { EMPLOYMENT_TYPE_LABELS, LOCATION_TYPE_LABELS } from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

export function JobCard({
  job,
  selected,
  onToggle,
}: {
  job: JobRecord;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card p-5 transition-all hover:shadow-md",
        selected ? "border-primary ring-1 ring-primary/40" : "hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/careers/${job.slug}`} className="font-medium leading-snug hover:text-primary">
            {job.title}
          </Link>
          <p className="mt-0.5 text-sm text-muted-foreground">{job.department}</p>
        </div>
        {/* Select for multi-apply */}
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={selected ? `Deselect ${job.title}` : `Select ${job.title}`}
          onClick={() => onToggle(job.id)}
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input hover:border-primary",
          )}
        >
          {selected && <Check className="size-3.5" />}
        </button>
      </div>

      <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-4" />
        {job.location} · {LOCATION_TYPE_LABELS[job.locationType]} ·{" "}
        {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
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
        <Link href={`/careers/${job.slug}`} className="text-muted-foreground hover:text-foreground">
          View details
        </Link>
        <Link
          href={`/careers/apply?jobs=${job.id}`}
          className="font-medium text-primary hover:underline"
        >
          Apply →
        </Link>
      </div>
    </div>
  );
}
