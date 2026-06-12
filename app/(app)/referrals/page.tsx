import type { Metadata } from "next";
import { Gift, Plus } from "lucide-react";
import Link from "next/link";

import { AddCandidateDialog } from "@/components/referrals/add-candidate-dialog";
import { ReferralStatusBadge } from "@/components/stage-badge";
import { getCurrentUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import type { ReferralRecord } from "@/lib/data";
import { initials } from "@/lib/format";
import type { ReferralStatus } from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Referrals" };

/** Bonus eligibility derived from where the referral has reached. */
function bonus(status: ReferralStatus): { label: string; className: string } {
  if (status === "HIRED")
    return { label: "Eligible — pending payout", className: "bg-emerald-50 text-emerald-700" };
  if (status === "REJECTED")
    return { label: "Not eligible", className: "bg-slate-100 text-slate-500" };
  return { label: "In process", className: "bg-amber-50 text-amber-700" };
}

export default async function ReferralsPage() {
  const user = await getCurrentUser();
  const isHr = user.role === "HR_ADMIN";
  const [referrals, jobs] = await Promise.all([
    isHr ? repo.listReferrals() : repo.listReferralsByReferrer(user.id),
    repo.listJobs({ status: "PUBLISHED" }),
  ]);
  const jobOptions = jobs.map((j) => ({ id: j.id, title: j.title }));

  // Leaderboard (HR only): referred / hired / in-process per referrer.
  const board = new Map<string, { name: string; total: number; hired: number; inProcess: number }>();
  for (const r of referrals) {
    const e = board.get(r.referrer.id) ?? { name: r.referrer.name, total: 0, hired: 0, inProcess: 0 };
    e.total += 1;
    if (r.status === "HIRED") e.hired += 1;
    else if (r.status !== "REJECTED") e.inProcess += 1;
    board.set(r.referrer.id, e);
  }
  const leaderboard = [...board.values()].sort(
    (a, b) => b.hired - a.hired || b.total - a.total,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {isHr ? "Referral tracker" : "My referrals"}
          </h1>
          <p className="mt-1 text-slate-500">
            Every referral, its status, and bonus eligibility in one place.
          </p>
        </div>
        <AddCandidateDialog
          jobs={jobOptions}
          defaultSource="REFERRAL"
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          <Plus className="size-4" />
          Submit a referral
        </AddCandidateDialog>
      </div>

      {referrals.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Gift className="size-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            No referrals yet.{" "}
            <Link href="/referrals/new" className="font-semibold text-violet-600 hover:text-violet-700">
              Refer someone
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          {/* Tracker table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Candidate</th>
                  <th className="px-5 py-3">Role</th>
                  {isHr && <th className="px-5 py-3">Referred by</th>}
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3">Bonus status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((r: ReferralRecord) => {
                  const b = bonus(r.status);
                  return (
                    <tr key={r.id}>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {r.applicationId ? (
                          <Link href={`/candidates/${r.applicationId}`} className="hover:text-violet-700">
                            {r.candidate.name}
                          </Link>
                        ) : (
                          r.candidate.name
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{r.job.title}</td>
                      {isHr && (
                        <td className="px-5 py-3.5 text-slate-600">{r.referrer.name}</td>
                      )}
                      <td className="px-5 py-3.5">
                        <ReferralStatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                            b.className,
                          )}
                        >
                          {b.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Leaderboard (HR only) */}
          {isHr && leaderboard.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Referral leaderboard</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {leaderboard.slice(0, 4).map((p, i) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <span className="text-lg font-bold text-slate-300">#{i + 1}</span>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                      {initials(p.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {p.total} referred · {p.hired} hired · {p.inProcess} in process
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
