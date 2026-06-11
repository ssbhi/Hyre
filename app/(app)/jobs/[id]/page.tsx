import type { Metadata } from "next";
import { ArrowLeft, Briefcase, CalendarDays, MapPin, Pencil, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JobRowActions } from "@/components/jobs/job-row-actions";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { StageBadge } from "@/components/stage-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { repo } from "@/lib/data";
import { formatDate, initials, relativeTime } from "@/lib/format";
import { EMPLOYMENT_TYPE_LABELS, LOCATION_TYPE_LABELS } from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await repo.getJobById(id);
  return { title: job?.title ?? "Job" };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await repo.getJobById(id);
  if (!job) notFound();

  const applicants = await repo.listPipeline({ jobId: id });

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to jobs
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
            <JobStatusBadge status={job.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="size-4" />
              {job.department} · {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {job.location} ({LOCATION_TYPE_LABELS[job.locationType]})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" />
              {job.openings} opening{job.openings === 1 ? "" : "s"}
            </span>
            {job.postedAt && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                Posted {formatDate(job.postedAt)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/jobs/${id}/edit`} className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}>
            <Pencil className="size-4" />
            Edit
          </Link>
          <JobRowActions id={job.id} status={job.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Description + skills */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About the role</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-foreground/90">{job.description}</p>
            </CardContent>
          </Card>

          {job.requiredSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Required skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Detail label="Hiring manager" value={job.hiringManager?.name ?? "—"} />
              <Detail label="Recruiter" value={job.recruiter?.name ?? "—"} />
              <Detail label="Created" value={formatDate(job.createdAt)} />
              <Detail label="Applicants" value={String(job.applicantCount ?? applicants.length)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Applicants
                <span className="text-sm font-normal text-muted-foreground">{applicants.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {applicants.length === 0 && (
                <p className="text-sm text-muted-foreground">No applicants yet.</p>
              )}
              {applicants.slice(0, 10).map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 py-1.5">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium">
                    {initials(a.candidate?.name ?? "?")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.candidate?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      applied {relativeTime(a.createdAt)}
                    </p>
                  </div>
                  <StageBadge stage={a.stage} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
