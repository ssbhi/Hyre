import type { Metadata } from "next";

import { BarList, Funnel } from "@/components/analytics/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { repo } from "@/lib/data";
import { pct } from "@/lib/format";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const a = await repo.getAnalytics();

  const stats = [
    { label: "Total applications", value: a.totals.applications },
    { label: "Hired", value: a.totals.hired },
    { label: "Avg time to hire", value: a.avgTimeToHireDays != null ? `${a.avgTimeToHireDays}d` : "—" },
    { label: "Referral conversion", value: pct(a.referralConversionRate) },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Hiring funnel, sources, and team performance across all roles.
        </p>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Funnel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hiring funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <Funnel steps={a.funnel} />
          </CardContent>
        </Card>

        {/* Source of applications */}
        <Card>
          <CardHeader>
            <CardTitle>Source of candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList items={a.sourceBreakdown.map((s) => ({ label: s.label, count: s.count }))} />
          </CardContent>
        </Card>

        {/* Applications by department */}
        <Card>
          <CardHeader>
            <CardTitle>Applications by department</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList items={a.byDepartment.map((d) => ({ label: d.department, count: d.count }))} />
          </CardContent>
        </Card>

        {/* Stage distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Current stage distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList items={a.stageCounts.map((s) => ({ label: s.label, count: s.count }))} />
          </CardContent>
        </Card>

        {/* Top referrers */}
        <Card>
          <CardHeader>
            <CardTitle>Top referrers</CardTitle>
          </CardHeader>
          <CardContent>
            {a.topReferrers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No referrals yet.</p>
            ) : (
              <div className="space-y-2.5">
                {a.topReferrers.map((r) => (
                  <div key={r.name} className="flex items-center justify-between text-sm">
                    <span>{r.name}</span>
                    <span className="text-muted-foreground">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {r.hired}
                      </span>{" "}
                      hired / {r.total}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
