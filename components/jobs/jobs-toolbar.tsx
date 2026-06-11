"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

const TABS: { value: "ALL" | JobStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PUBLISHED", label: JOB_STATUS_LABELS.PUBLISHED },
  { value: "DRAFT", label: JOB_STATUS_LABELS.DRAFT },
  { value: "ARCHIVED", label: JOB_STATUS_LABELS.ARCHIVED },
];

export function JobsToolbar({ status, q }: { status: string; q: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(q);

  // Debounced URL update for the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (search) next.set("q", search);
      else next.delete("q");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function setStatus(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "ALL") next.delete("status");
    else next.set("status", value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const current = status || "ALL";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              current === t.value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative w-full sm:w-64">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs…"
          className="h-9 w-full rounded-lg border bg-background pr-3 pl-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      </div>
    </div>
  );
}
