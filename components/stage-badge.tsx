import {
  REFERRAL_STATUS_META,
  STAGE_META,
  type PipelineStage,
  type ReferralStatus,
  type StageTone,
} from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<StageTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  progress: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function Pill({ tone, children }: { tone: StageTone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StageBadge({ stage }: { stage: PipelineStage }) {
  const meta = STAGE_META[stage];
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  const meta = REFERRAL_STATUS_META[status];
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}
