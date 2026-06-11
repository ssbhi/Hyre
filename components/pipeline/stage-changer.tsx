"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { moveCandidateStage } from "@/lib/actions/pipeline";
import { PIPELINE_STAGES, STAGE_META, type PipelineStage } from "@/lib/schemas/enums";

export function StageChanger({
  applicationId,
  current,
}: {
  applicationId: string;
  current: PipelineStage;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const toStage = e.target.value as PipelineStage;
    if (toStage === current) return;
    startTransition(async () => {
      const res = await moveCandidateStage(applicationId, toStage);
      if (res.ok) {
        toast.success(`Moved to ${STAGE_META[toStage].label}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <select
      value={current}
      onChange={onChange}
      disabled={pending}
      aria-label="Change stage"
      className="h-9 rounded-lg border bg-background px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
    >
      {PIPELINE_STAGES.map((s) => (
        <option key={s} value={s}>
          {STAGE_META[s].label}
        </option>
      ))}
    </select>
  );
}
