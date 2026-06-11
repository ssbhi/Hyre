import type { Metadata } from "next";
import {
  ArrowRight,
  Briefcase,
  CalendarCheck,
  Inbox,
  Plus,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import { QuickActions } from "@/components/app/quick-actions";
import { StatTile } from "@/components/app/stat-tile";
import { ReferralStatusBadge, StageBadge } from "@/components/stage-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { initials, pct, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PipelineStage } from "@/lib/schemas/enums";

export const metadata: Metadata = { title: "Dashboard" };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const [user, stats, jobs, pipeline, referrals] = await Promise.all([
    getCurrentUser(),
    repo.getDashboardStats(),
    repo.listJobs({ status: "PUBLISHED" }),
    repo.listPipeline(),
    repo.listReferrals(),
  ]);

  const stageCount = (stage: PipelineStage) =>
    stats.stageCounts.find((s) => s.stage === stage)?.count ?? 0;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = pipeline.filter((a) => new Date(a.createdAt).getTime() >= weekAgo).length;
  const toReview = stageCount("APPLIED") + stageCount("SCREENING");

  const recentJobs = jobs.slice(0, 5);
  const needsAttention = pipeline
    .filter((a) => a.stage === "APPLIED" || a.stage === "SCREENING")
    .slice(0, 6);
  const recentReferrals = referrals.slice(0, 4);
  const funnelMax = stats.funnel[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your pipeline today.
          </p>
        </div>
        <Link href="/jobs" className={cn(buttonVariants(), "gap-1.5")}>
          <Plus className="size-4" />
          Post a job
        </Link>
      </div>

      {/* Stat tiles — quick status of jobs & applicants */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Active jobs" value={stats.openPositions} icon={Briefcase} accent hint="Currently published" />
        <StatTile label="New applications" value={newThisWeek} icon={Inbox} hint="In the last 7 days" />
        <StatTile label="To be reviewed" value={toReview} icon={Users} hint="Applied + screening" />
        <StatTile label="Shortlisted" value={stageCount("SHORTLISTED")} icon={Star} hint="Awaiting interview" />
        <StatTile label="Interviews scheduled" value={stageCount("INTERVIEW_SCHEDULED")} icon={CalendarCheck} hint="Upcoming interviews" />
      </div>

      {/* Funnel + referral snapshot */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hiring funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.funnel.map((f, i) => {
              const width = Math.max(4, Math.round((f.count / funnelMax) * 100));
              return (
                <div key={f.stage}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-medium tabular-nums">{f.count}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${width}%`, backgroundColor: `var(--chart-${(i % 5) + 1})` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Referrals
              <Link href="/referrals" className="text-xs font-normal text-primary hover:underline">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-2xl font-semibold tabular-nums">{stats.activeReferrals}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-2xl font-semibold tabular-nums">{pct(stats.referralConversionRate)}</div>
                <div className="text-xs text-muted-foreground">Conversion</div>
              </div>
            </div>
            <div className="space-y-3">
              {recentReferrals.map((r) => (
                <div key={r.id} className="flex items-center gap-2.5">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium">
                    {initials(r.referrer.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-medium">{r.referrer.name.split(" ")[0]}</span>
                      {" referred "}
                      <span className="font-medium">{r.candidate.name}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{r.job.title}</p>
                  </div>
                  <ReferralStatusBadge status={r.status} />
                </div>
              ))}
              {recentReferrals.length === 0 && (
                <p className="text-sm text-muted-foreground">No referrals yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Needs attention + recent jobs */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="size-4 text-primary" />
              Needs your attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {needsAttention.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                You&apos;re all caught up. 🎉
              </p>
            )}
            {needsAttention.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-sm font-medium">
                  {initials(a.candidate?.name ?? "?")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.candidate?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.job?.title} · applied {relativeTime(a.createdAt)}
                  </p>
                </div>
                <StageBadge stage={a.stage} />
                <QuickActions applicationId={a.id} candidateName={a.candidate?.name ?? "Candidate"} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent jobs
              <Link href="/jobs" className="text-xs font-normal text-primary hover:underline">
                See all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentJobs.map((j) => (
              <Link
                key={j.id}
                href="/jobs"
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{j.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{j.department}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">{j.applicantCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">applicants</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground/50" />
              </Link>
            ))}
            {recentJobs.length === 0 && (
              <p className="text-sm text-muted-foreground">No published jobs yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
