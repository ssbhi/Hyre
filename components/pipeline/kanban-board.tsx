"use client";

import { GripVertical, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { moveCandidateStage } from "@/lib/actions/pipeline";
import type { ApplicationRecord } from "@/lib/data";
import { initials, relativeTime } from "@/lib/format";
import {
  ACTIVE_PIPELINE_STAGES,
  PIPELINE_STAGES,
  STAGE_META,
  type PipelineStage,
} from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

const TONE_DOT: Record<string, string> = {
  neutral: "bg-muted-foreground/50",
  info: "bg-blue-500",
  progress: "bg-violet-500",
  success: "bg-emerald-500",
  danger: "bg-red-500",
  warning: "bg-amber-500",
};

export function KanbanBoard({ applications }: { applications: ApplicationRecord[] }) {
  const [items, setItems] = useState(applications);
  const [, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<PipelineStage | null>(null);

  const byStage = useMemo(() => {
    const map = new Map<PipelineStage, ApplicationRecord[]>();
    for (const stage of ACTIVE_PIPELINE_STAGES) map.set(stage, []);
    for (const app of items) {
      const bucket = map.get(app.stage);
      if (bucket) bucket.push(app);
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
        setItems(snapshot); // revert
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {ACTIVE_PIPELINE_STAGES.map((stage) => {
        const cards = byStage.get(stage) ?? [];
        const meta = STAGE_META[stage];
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overStage !== stage) setOverStage(stage);
            }}
            onDragLeave={(e) => {
              // Only clear when leaving the column entirely.
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverStage(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              setOverStage(null);
              setDragId(null);
              if (id) move(id, stage);
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30 transition-colors",
              overStage === stage && "border-primary/50 bg-primary/5",
            )}
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", TONE_DOT[meta.tone])} />
                <span className="text-sm font-medium">{meta.label}</span>
              </div>
              <span className="rounded-full bg-background px-1.5 text-xs font-medium text-muted-foreground tabular-nums">
                {cards.length}
              </span>
            </div>

            <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
              {cards.map((app) => (
                <article
                  key={app.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", app.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDragId(app.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverStage(null);
                  }}
                  className={cn(
                    "group/card cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing",
                    dragId === app.id && "opacity-40",
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <Link
                      href={`/candidates/${app.id}`}
                      className="text-sm font-medium leading-snug hover:text-primary"
                    >
                      {app.candidate?.name ?? "Candidate"}
                    </Link>
                    <CardMenu appId={app.id} currentStage={app.stage} onMove={move} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{app.job?.title}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      {relativeTime(app.updatedAt)}
                    </span>
                    {app.recruiter && (
                      <span
                        title={app.recruiter.name}
                        className="grid size-5 place-items-center rounded-full bg-primary/10 text-[10px] font-medium text-primary"
                      >
                        {initials(app.recruiter.name)}
                      </span>
                    )}
                  </div>
                </article>
              ))}

              {cards.length === 0 && (
                <div className="grid flex-1 place-items-center rounded-lg border border-dashed text-xs text-muted-foreground/60">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CardMenu({
  appId,
  currentStage,
  onMove,
}: {
  appId: string;
  currentStage: PipelineStage;
  onMove: (id: string, stage: PipelineStage) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Card actions"
        className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity outline-none group-hover/card:opacity-100 hover:bg-muted focus-visible:opacity-100"
      >
        <MoreVertical className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem render={<Link href={`/candidates/${appId}`} />}>
          Open profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <GripVertical />
            Move to
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {PIPELINE_STAGES.map((stage) => (
              <DropdownMenuItem
                key={stage}
                disabled={stage === currentStage}
                onClick={() => onMove(appId, stage)}
              >
                {STAGE_META[stage].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
