import type { Metadata } from "next";
import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";

import { repo } from "@/lib/data";
import { initials } from "@/lib/format";
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
  const [stats, referrals] = await Promise.all([
    repo.getDashboardStats(),
    repo.listReferrals(),
  ]);

  const stageCount = (stage: PipelineStage) =>
    stats.stageCounts.find((s) => s.stage === stage)?.count ?? 0;

  // Active candidates = anyone in the pipeline who hasn't reached a terminal stage.
  const activeCandidates =
    stats.stageCounts
      .filter((s) => !["HIRED", "REJECTED", "ON_HOLD"].includes(s.stage))
      .reduce((sum, s) => sum + s.count, 0);

  // Collapse the 8 ATS stages into the 5 funnel buckets the design shows.
  const funnel = [
    { label: "Applied", count: stageCount("APPLIED"), color: "bg-primary" },
    {
      label: "Screening",
      count: stageCount("SCREENING") + stageCount("SHORTLISTED"),
      color: "bg-sky-500",
    },
    {
      label: "Interview",
      count: stageCount("INTERVIEW_SCHEDULED") + stageCount("INTERVIEW_COMPLETED"),
      color: "bg-amber-500",
    },
    {
      label: "Offer",
      count: stageCount("OFFER_EXTENDED") + stageCount("OFFER_ACCEPTED"),
      color: "bg-fuchsia-500",
    },
    { label: "Hired", count: stageCount("HIRED"), color: "bg-emerald-500" },
  ];
  const funnelMax = Math.max(1, ...funnel.map((f) => f.count));

  // Top referrers, derived from the referral list.
  const refMap = new Map<string, { total: number; hired: number }>();
  for (const r of referrals) {
    const e = refMap.get(r.referrer.name) ?? { total: 0, hired: 0 };
    e.total += 1;
    if (r.status === "HIRED") e.hired += 1;
    refMap.set(r.referrer.name, e);
  }
  const topReferrers = [...refMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.hired - a.hired || b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {greeting()} <span className="align-middle">👋</span>
        </h1>
        <p className="mt-1 text-slate-500">Here&apos;s where hiring stands today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={stats.openPositions} label="Open roles" accent="violet" />
        <StatCard value={activeCandidates} label="Active candidates" accent="sky" />
        <StatCard value={referrals.length} label="Referrals received" accent="amber" />
        <StatCard value={stageCount("HIRED")} label="Hires this quarter" accent="emerald" />
      </div>

      {/* Funnel + top referrers */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Pipeline funnel */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Pipeline funnel</h2>
          <div className="mt-5 space-y-4">
            {funnel.map((row) => (
              <div key={row.label} className="flex items-center gap-4">
                <span className="w-20 shrink-0 text-sm text-slate-600">{row.label}</span>
                <div className="h-7 flex-1 overflow-hidden rounded-md bg-slate-100">
                  <div
                    className={cn("h-full rounded-md transition-all", row.color)}
                    style={{ width: `${Math.round((row.count / funnelMax) * 100)}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-700">
                  {row.count}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/candidates"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80"
          >
            Open full pipeline <ArrowRight className="size-4" />
          </Link>
        </section>

        {/* Top referrers */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Top referrers</h2>
          <div className="mt-5 space-y-4">
            {topReferrers.length === 0 && (
              <p className="text-sm text-slate-500">No referrals yet.</p>
            )}
            {topReferrers.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {initials(r.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{r.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {r.total} referred · {r.hired} hired
                  </p>
                </div>
                {i === 0 && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    Top
                  </span>
                )}
              </div>
            ))}
          </div>
          <Link
            href="/referrals"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80"
          >
            View referral tracker <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}

const ACCENTS = {
  violet: { border: "border-t-primary", text: "text-primary" },
  sky: { border: "border-t-sky-500", text: "text-sky-600" },
  amber: { border: "border-t-amber-500", text: "text-amber-600" },
  emerald: { border: "border-t-emerald-500", text: "text-emerald-600" },
} as const;

function StatCard({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: keyof typeof ACCENTS;
}) {
  const a = ACCENTS[accent];
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 border-t-4 bg-white p-5 shadow-sm",
        a.border,
      )}
    >
      <p className={cn("text-4xl font-bold tabular-nums", a.text)}>{value}</p>
      <p className="mt-2 text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}
