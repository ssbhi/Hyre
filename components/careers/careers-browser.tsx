"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { JobCard } from "@/components/careers/job-card";
import type { JobRecord } from "@/lib/data";
import { LOCATION_TYPES, LOCATION_TYPE_LABELS } from "@/lib/schemas/enums";

const selectClass =
  "h-10 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function CareersBrowser({
  jobs,
  departments,
}: {
  jobs: JobRecord[];
  departments: string[];
}) {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("");
  const [type, setType] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      if (dept && j.department !== dept) return false;
      if (type && j.locationType !== type) return false;
      if (!q) return true;
      return (
        j.title.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [jobs, query, dept, type]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedIds = [...selected];

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, skill, or location…"
            className="h-10 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
        <select className={selectClass} value={dept} onChange={(e) => setDept(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select className={selectClass} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Any location</option>
          {LOCATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {LOCATION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} open role{filtered.length === 1 ? "" : "s"} · tick roles to apply to
        several at once
      </p>

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          No roles match your search. Try clearing the filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} selected={selected.has(job.id)} onToggle={toggle} />
          ))}
        </div>
      )}

      {/* Sticky multi-apply bar */}
      {selectedIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-3">
            <span className="text-sm">
              <span className="font-semibold">{selectedIds.length}</span> role
              {selectedIds.length === 1 ? "" : "s"} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set())}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
              <Link
                href={`/careers/apply?jobs=${selectedIds.join(",")}`}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Apply to {selectedIds.length} role{selectedIds.length === 1 ? "" : "s"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
