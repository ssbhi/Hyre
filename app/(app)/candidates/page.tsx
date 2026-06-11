import type { Metadata } from "next";

import { KanbanBoard } from "@/components/pipeline/kanban-board";
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

  const [applications, jobs] = await Promise.all([
    repo.listPipeline({ jobId, search: q }),
    repo.listJobs(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Drag candidates between stages, or use the card menu. {applications.length} in pipeline.
        </p>
      </div>

      <PipelineToolbar
        jobs={jobs.map((j) => ({ id: j.id, title: j.title }))}
        jobId={jobId ?? ""}
        q={q ?? ""}
      />

      {/* key remounts the board with fresh data when filters change */}
      <KanbanBoard key={`${jobId ?? "all"}:${q ?? ""}`} applications={applications} />
    </div>
  );
}
