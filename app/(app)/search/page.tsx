import type { Metadata } from "next";
import Link from "next/link";

import { SearchFilters } from "@/components/search/search-filters";
import { StageBadge } from "@/components/stage-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { repo } from "@/lib/data";
import { formatDate, initials } from "@/lib/format";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/schemas/enums";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; jobId?: string; stage?: string; recruiterId?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const jobId = sp.jobId?.trim() || undefined;
  const recruiterId = sp.recruiterId?.trim() || undefined;
  const stage = (PIPELINE_STAGES as readonly string[]).includes(sp.stage ?? "")
    ? (sp.stage as PipelineStage)
    : undefined;

  const [results, jobs, recruiters] = await Promise.all([
    repo.listPipeline({ search: q, jobId, stage, recruiterId }),
    repo.listJobs(),
    repo.listUsersByRole("HR_ADMIN"),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search candidates</h1>
        <p className="text-sm text-muted-foreground">
          Filter the talent pool by name, skill, role, stage, or recruiter.
        </p>
      </div>

      <SearchFilters
        jobs={jobs.map((j) => ({ id: j.id, title: j.title }))}
        recruiters={recruiters.map((r) => ({ id: r.id, name: r.name }))}
        q={q ?? ""}
        jobId={jobId ?? ""}
        stage={stage ?? ""}
        recruiterId={recruiterId ?? ""}
      />

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground">
          <span>
            {results.length} result{results.length === 1 ? "" : "s"}
          </span>
        </div>
        {results.length === 0 ? (
          <div className="grid place-items-center border-t py-16 text-center text-sm text-muted-foreground">
            No candidates match these filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Recruiter</TableHead>
                <TableHead className="text-right">Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link
                      href={`/candidates/${a.id}`}
                      className="flex items-center gap-2.5 font-medium hover:text-primary"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
                        {initials(a.candidate?.name ?? "?")}
                      </span>
                      <span className="flex flex-col">
                        <span>{a.candidate?.name}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {a.candidate?.currentTitle ?? a.candidate?.email}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.job?.title}</TableCell>
                  <TableCell>
                    <StageBadge stage={a.stage} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.recruiter?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(a.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
