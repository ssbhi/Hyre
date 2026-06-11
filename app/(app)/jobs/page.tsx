import type { Metadata } from "next";
import { Plus } from "lucide-react";
import Link from "next/link";

import { JobRowActions } from "@/components/jobs/job-row-actions";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { JobsToolbar } from "@/components/jobs/jobs-toolbar";
import { buttonVariants } from "@/components/ui/button";
import { repo } from "@/lib/data";
import {
  EMPLOYMENT_TYPE_LABELS,
  JOB_STATUSES,
  LOCATION_TYPE_LABELS,
  type JobStatus,
} from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Jobs" };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = (JOB_STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as JobStatus)
    : undefined;

  const jobs = await repo.listJobs({ status, search: q || undefined });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            Create, publish, and manage your open roles.
          </p>
        </div>
        <Link href="/jobs/new" className={cn(buttonVariants(), "gap-1.5")}>
          <Plus className="size-4" />
          New job
        </Link>
      </div>

      <JobsToolbar status={sp.status ?? ""} q={q} />

      {jobs.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No jobs match your filters.{" "}
            <Link href="/jobs/new" className="text-primary hover:underline">
              Create one
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border bg-card">
          {jobs.map((j) => (
            <div key={j.id} className="flex items-center gap-4 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/jobs/${j.id}`}
                    className="truncate font-medium hover:text-primary"
                  >
                    {j.title}
                  </Link>
                  <JobStatusBadge status={j.status} />
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {j.department} · {EMPLOYMENT_TYPE_LABELS[j.employmentType]} ·{" "}
                  {j.location} ({LOCATION_TYPE_LABELS[j.locationType]})
                </p>
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold tabular-nums">{j.applicantCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">applicants</p>
              </div>
              <div className="hidden text-right md:block">
                <p className="text-sm tabular-nums">{j.openings}</p>
                <p className="text-xs text-muted-foreground">openings</p>
              </div>

              <JobRowActions id={j.id} status={j.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
