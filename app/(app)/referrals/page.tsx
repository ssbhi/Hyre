import type { Metadata } from "next";
import { Gift, Plus } from "lucide-react";
import Link from "next/link";

import { ReferralStatusSelect } from "@/components/referrals/referral-status-select";
import { ReferralStatusBadge } from "@/components/stage-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import type { ReferralRecord } from "@/lib/data";
import { formatDate, initials, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Referrals" };

function summarize(refs: ReferralRecord[]) {
  const hired = refs.filter((r) => r.status === "HIRED").length;
  const active = refs.filter((r) => !["HIRED", "REJECTED"].includes(r.status)).length;
  return {
    total: refs.length,
    active,
    hired,
    rate: refs.length === 0 ? 0 : hired / refs.length,
  };
}

export default async function ReferralsPage() {
  const user = await getCurrentUser();
  const isHr = user.role === "HR_ADMIN";
  const referrals = isHr
    ? await repo.listReferrals()
    : await repo.listReferralsByReferrer(user.id);
  const stats = summarize(referrals);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isHr ? "Referrals" : "My referrals"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isHr
              ? "Track employee referrals and conversion across all roles."
              : "Refer great people and track where they are in the process."}
          </p>
        </div>
        <Link href="/referrals/new" className={cn(buttonVariants(), "gap-1.5")}>
          <Plus className="size-4" />
          Refer a candidate
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={isHr ? "Total referrals" : "Your referrals"} value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Hired" value={stats.hired} />
        <StatCard label="Conversion" value={pct(stats.rate)} />
      </div>

      {referrals.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed py-16 text-center">
          <Gift className="size-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            No referrals yet.{" "}
            <Link href="/referrals/new" className="text-primary hover:underline">
              Refer someone
            </Link>
            .
          </p>
        </div>
      ) : isHr ? (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Referred by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.applicationId ? (
                      <Link
                        href={`/candidates/${r.applicationId}`}
                        className="font-medium hover:text-primary"
                      >
                        {r.candidate.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{r.candidate.name}</span>
                    )}
                    <div className="text-xs text-muted-foreground">{r.candidate.email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.job.title}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-muted text-[10px] font-medium">
                        {initials(r.referrer.name)}
                      </span>
                      {r.referrer.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ReferralStatusSelect referralId={r.id} current={r.status} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{r.candidate.name}</p>
                  <p className="text-sm text-muted-foreground">{r.job.title}</p>
                </div>
                <ReferralStatusBadge status={r.status} />
              </div>
              {r.comment && <p className="mt-2 text-sm text-foreground/80">“{r.comment}”</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                Referred {formatDate(r.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
