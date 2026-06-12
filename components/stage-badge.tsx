import {
  REFERRAL_STATUS_META,
  STAGE_META,
  type PipelineStage,
  type ReferralStatus,
  type StageTone,
} from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

// Tones map to the TrueBalance status tokens (Move 6: state paint).
const TONE_CLASSES: Record<StageTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-(--tb-info)/10 text-(--tb-info)",
  progress: "bg-accent text-accent-foreground",
  success: "bg-(--tb-success)/10 text-(--tb-success)",
  danger: "bg-(--tb-error)/10 text-(--tb-error)",
  warning: "bg-(--tb-warning)/10 text-(--tb-warning)",
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
