import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileText,
  Link2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddFeedbackForm } from "@/components/pipeline/add-feedback-form";
import { AddNoteForm } from "@/components/pipeline/add-note-form";
import { RecruiterSelect } from "@/components/pipeline/recruiter-select";
import { StageChanger } from "@/components/pipeline/stage-changer";
import { StageBadge } from "@/components/stage-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { repo } from "@/lib/data";
import { formatDate, initials, relativeTime } from "@/lib/format";
import { RECOMMENDATION_LABELS, STAGE_META, type Recommendation } from "@/lib/schemas/enums";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const app = await repo.getApplicationDetail(id);
  return { title: app ? app.candidate.name : "Candidate" };
}

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [app, recruiters] = await Promise.all([
    repo.getApplicationDetail(id),
    repo.listUsersByRole("HR_ADMIN"),
  ]);
  if (!app) notFound();

  const { candidate } = app;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href="/candidates"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to pipeline
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-base font-semibold text-primary">
            {initials(candidate.name)}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{candidate.name}</h1>
            <p className="text-sm text-muted-foreground">
              {candidate.currentTitle ?? "—"}
              {candidate.currentEmployer ? ` · ${candidate.currentEmployer}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StageBadge stage={app.stage} />
          <StageChanger applicationId={app.id} current={app.stage} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-4 lg:col-span-2">
          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddNoteForm applicationId={app.id} />
              <div className="space-y-3">
                {app.notes.length === 0 && (
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                )}
                {app.notes.map((n) => (
                  <div key={n.id} className="rounded-lg border bg-muted/20 p-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{n.author?.name ?? "System"}</span>
                      <span>{relativeTime(n.createdAt)}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{n.body}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Interview feedback</CardTitle>
              <AddFeedbackForm applicationId={app.id} />
            </CardHeader>
            <CardContent className="space-y-3">
              {app.feedback.length === 0 && (
                <p className="text-sm text-muted-foreground">No feedback recorded yet.</p>
              )}
              {app.feedback.map((f) => (
                <div key={f.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{f.round ?? "Feedback"}</span>
                    <div className="flex items-center gap-2 text-xs">
                      {f.rating != null && (
                        <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                          {f.rating}/5
                        </span>
                      )}
                      {f.recommendation && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                          {RECOMMENDATION_LABELS[f.recommendation as Recommendation]}
                        </span>
                      )}
                    </div>
                  </div>
                  {f.strengths && (
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">Strengths: </span>
                      {f.strengths}
                    </p>
                  )}
                  {f.concerns && (
                    <p className="mt-1 text-sm">
                      <span className="text-muted-foreground">Concerns: </span>
                      {f.concerns}
                    </p>
                  )}
                  {f.comments && <p className="mt-1 text-sm">{f.comments}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {f.interviewer?.name ?? "Interviewer"} · {relativeTime(f.createdAt)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l pl-5">
                {app.stageEvents.map((ev) => (
                  <li key={ev.id} className="relative">
                    <span className="absolute top-1 -left-[1.4rem] size-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="text-sm font-medium">{STAGE_META[ev.toStage].label}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(ev.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ev.changedBy ? `by ${ev.changedBy.name}` : ev.note ?? "—"}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Candidate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <IconRow icon={<Mail className="size-4" />} value={candidate.email} />
              {candidate.phone && <IconRow icon={<Phone className="size-4" />} value={candidate.phone} />}
              {candidate.location && (
                <IconRow icon={<MapPin className="size-4" />} value={candidate.location} />
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Stat label="Experience" value={candidate.totalExperienceYears != null ? `${candidate.totalExperienceYears} yrs` : "—"} />
                <Stat label="Notice" value={candidate.noticePeriodDays != null ? `${candidate.noticePeriodDays} days` : "—"} />
                <Stat label="Current CTC" value={candidate.currentCtc ?? "—"} />
                <Stat label="Expected" value={candidate.expectedCtc ?? "—"} />
              </div>

              {candidate.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {candidate.skills.map((s) => (
                    <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-1 text-sm">
                {candidate.resumeUrl && (
                  <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <FileText className="size-4" /> Resume
                  </a>
                )}
                {candidate.linkedinUrl && (
                  <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <Link2 className="size-4" /> LinkedIn
                  </a>
                )}
                {candidate.portfolioUrl && (
                  <a href={candidate.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="size-4" /> Portfolio
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Role</span>
                <Link href={`/jobs/${app.job.id}`} className="font-medium text-primary hover:underline">
                  {app.job.title}
                </Link>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Recruiter</span>
                <RecruiterSelect
                  applicationId={app.id}
                  current={app.recruiter?.id ?? null}
                  recruiters={recruiters.map((r) => ({ id: r.id, name: r.name }))}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="size-4" /> Applied
                </span>
                <span className="font-medium">{formatDate(app.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function IconRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="truncate text-foreground">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
