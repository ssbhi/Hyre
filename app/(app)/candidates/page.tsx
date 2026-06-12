import type { Metadata } from "next";

import { KanbanBoard, type PipelineCard } from "@/components/pipeline/kanban-board";
import { PipelineToolbar } from "@/components/pipeline/pipeline-toolbar";
import { repo } from "@/lib/data";

export const metadata: Metadata = { title: "Pipeline" };

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const jobId = sp.jobId?.trim() || undefined;
  const q = sp.q?.trim() || undefined;

  const [applications, jobs, referrals] = await Promise.all([
    repo.listPipeline({ jobId, search: q }),
    repo.listJobs(),
    repo.listReferrals(),
  ]);

  // Map candidate → referrer name so cards can show "Referral · via {name}".
  const referrerByCandidate = new Map<string, string>();
  for (const r of referrals) referrerByCandidate.set(r.candidate.id, r.referrer.name);

  const cards: PipelineCard[] = applications.map((a) => ({
    ...a,
    referrerName: referrerByCandidate.get(a.candidateId) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Candidate pipeline</h1>
        <p className="mt-1 text-slate-500">Move candidates through stages as they progress.</p>
      </div>

      <PipelineToolbar
        jobs={jobs.map((j) => ({ id: j.id, title: j.title }))}
        jobId={jobId ?? ""}
        q={q ?? ""}
      />

      {/* key remounts the board with fresh data when filters change */}
      <KanbanBoard key={`${jobId ?? "all"}:${q ?? ""}`} applications={cards} />
    </div>
  );
}
