import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  accent = false,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={cn(
            "grid size-7 place-items-center rounded-md",
            accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="text-3xl font-semibold tabular-nums tracking-tight">{value}</div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
