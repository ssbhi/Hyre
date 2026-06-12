import type { Metadata } from "next";
import { Plus } from "lucide-react";
import Link from "next/link";

import { JobCardAction } from "@/components/jobs/job-card-action";
import { PostJobDialog } from "@/components/jobs/post-job-dialog";
import { repo } from "@/lib/data";
import { formatDate } from "@/lib/format";
import {
  EMPLOYMENT_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
  type JobStatus,
} from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Job board" };

const STATUS_BADGE: Record<JobStatus, { label: string; className: string }> = {
  PUBLISHED: { label: "Open", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  DRAFT: { label: "Draft", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  ARCHIVED: { label: "Closed", className: "bg-slate-100 text-slate-500 ring-slate-200" },
};

export default async function JobsPage() {
  const jobs = await repo.listJobs();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Job board</h1>
          <p className="mt-1 text-slate-500">
            Open roles visible to employees and external applicants.
          </p>
        </div>
        <PostJobDialog className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="size-4" />
          Post a job
        </PostJobDialog>
      </div>

      {jobs.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">
            No roles yet.{" "}
            <Link href="/jobs/new" className="font-semibold text-primary hover:text-primary/80">
              Post one
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((j) => {
            const badge = STATUS_BADGE[j.status];
            return (
              <div
                key={j.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/jobs/${j.id}`}
                    className="text-lg font-semibold text-slate-900 hover:text-primary"
                  >
                    {j.title}
                  </Link>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {j.department} · {j.location} · {LOCATION_TYPE_LABELS[j.locationType]} ·{" "}
                  {EMPLOYMENT_TYPE_LABELS[j.employmentType]}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Tag className="bg-accent text-accent-foreground">
                    {j.openings} {j.openings === 1 ? "opening" : "openings"}
                  </Tag>
                  <Tag className="bg-sky-50 text-sky-700">
                    {j.applicantCount ?? 0} {(j.applicantCount ?? 0) === 1 ? "applicant" : "applicants"}
                  </Tag>
                  {j.internalEligible && (
                    <Tag className="bg-rose-50 text-rose-600">Internal eligible</Tag>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-400">
                    Posted {formatDate(j.postedAt ?? j.createdAt)}
                  </span>
                  <JobCardAction id={j.id} status={j.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}
