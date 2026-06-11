"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PIPELINE_STAGES, STAGE_META } from "@/lib/schemas/enums";

const selectClass =
  "h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function SearchFilters({
  jobs,
  recruiters,
  q,
  jobId,
  stage,
  recruiterId,
}: {
  jobs: { id: string; title: string }[];
  recruiters: { id: string; name: string }[];
  q: string;
  jobId: string;
  stage: string;
  recruiterId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(q);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  useEffect(() => {
    const t = setTimeout(() => update("q", search), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters = q || jobId || stage || recruiterId;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-72">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, email, or skill…"
          className="h-9 w-full rounded-lg border bg-background pr-3 pl-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      </div>

      <select className={selectClass} value={jobId} onChange={(e) => update("jobId", e.target.value)}>
        <option value="">Any role</option>
        {jobs.map((j) => (
          <option key={j.id} value={j.id}>
            {j.title}
          </option>
        ))}
      </select>

      <select className={selectClass} value={stage} onChange={(e) => update("stage", e.target.value)}>
        <option value="">Any stage</option>
        {PIPELINE_STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_META[s].label}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={recruiterId}
        onChange={(e) => update("recruiterId", e.target.value)}
      >
        <option value="">Any recruiter</option>
        {recruiters.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => {
            setSearch("");
            router.replace(pathname);
          }}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
          Clear
        </button>
      )}
    </div>
  );
}
