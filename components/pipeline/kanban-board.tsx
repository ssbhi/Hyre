"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { moveCandidateStage } from "@/lib/actions/pipeline";
import type { ApplicationRecord } from "@/lib/data";
import { initials } from "@/lib/format";
import { PIPELINE_STAGES, STAGE_META, type PipelineStage } from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

/** An application enriched with the referrer's name (when it came via referral). */
export type PipelineCard = ApplicationRecord & { referrerName?: string | null };

/** The five visible columns and which ATS stages each one collects. */
const COLUMNS: { key: string; label: string; dot: string; stages: PipelineStage[] }[] = [
  { key: "applied", label: "Applied", dot: "bg-violet-500", stages: ["APPLIED"] },
  { key: "screening", label: "Screening", dot: "bg-sky-500", stages: ["SCREENING", "SHORTLISTED"] },
  {
    key: "interview",
    label: "Interview",
    dot: "bg-amber-500",
    stages: ["INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED"],
  },
  {
    key: "offer",
    label: "Offer",
    dot: "bg-fuchsia-500",
    stages: ["OFFER_EXTENDED", "OFFER_ACCEPTED"],
  },
  { key: "hired", label: "Hired", dot: "bg-emerald-500", stages: ["HIRED"] },
];

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
];
function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export function KanbanBoard({ applications }: { applications: PipelineCard[] }) {
  const [items, setItems] = useState(applications);
  const [, startTransition] = useTransition();

  const byColumn = useMemo(() => {
    const map = new Map<string, PipelineCard[]>();
    for (const col of COLUMNS) map.set(col.key, []);
    for (const app of items) {
      const col = COLUMNS.find((c) => c.stages.includes(app.stage));
      if (col) map.get(col.key)!.push(app);
    }
    return map;
  }, [items]);

  function move(appId: string, toStage: PipelineStage) {
    const app = items.find((a) => a.id === appId);
    if (!app || app.stage === toStage) return;

    const snapshot = items;
    setItems((prev) => prev.map((a) => (a.id === appId ? { ...a, stage: toStage } : a)));
    startTransition(async () => {
      const res = await moveCandidateStage(appId, toStage);
      if (res.ok) {
        toast.success(`${app.candidate?.name ?? "Candidate"} → ${STAGE_META[toStage].label}`);
      } else {
        setItems(snapshot);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const cards = byColumn.get(col.key) ?? [];
        return (
          <div key={col.key} className="flex w-72 shrink-0 flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <span className={cn("size-2.5 rounded-full", col.dot)} />
              <span className="text-sm font-semibold text-slate-700">{col.label}</span>
              <span className="text-sm font-medium text-slate-400 tabular-nums">{cards.length}</span>
            </div>

            <div className="flex flex-col gap-3">
              {cards.map((app) => (
                <CandidateCard key={app.id} app={app} onMove={move} />
              ))}
              {cards.length === 0 && (
                <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 py-8 text-sm text-slate-400">
                  No one here yet
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CandidateCard({
  app,
  onMove,
}: {
  app: PipelineCard;
  onMove: (id: string, stage: PipelineStage) => void;
}) {
  const isReferral = app.candidate?.source === "REFERRAL" || Boolean(app.referrerName);
  const name = app.candidate?.name ?? "Candidate";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
            avatarColor(name),
          )}
        >
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/candidates/${app.id}`}
            className="block truncate text-sm font-semibold text-slate-900 hover:text-violet-700"
          >
            {name}
          </Link>
          <p className="truncate text-xs text-slate-500">{app.job?.title}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {isReferral ? (
          <>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              Referral
            </span>
            {app.referrerName && (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                via {app.referrerName.split(" ")[0]}
              </span>
            )}
          </>
        ) : (
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
            Direct
          </span>
        )}
      </div>

      {app.coverNote && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{app.coverNote}</p>
      )}

      <select
        value={app.stage}
        onChange={(e) => onMove(app.id, e.target.value as PipelineStage)}
        aria-label={`Stage for ${name}`}
        className="mt-3 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
      >
        {PIPELINE_STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_META[s].label}
          </option>
        ))}
      </select>
    </article>
  );
}
