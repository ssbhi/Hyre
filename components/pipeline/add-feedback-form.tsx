"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { addApplicationFeedback } from "@/lib/actions/pipeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RECOMMENDATIONS, RECOMMENDATION_LABELS } from "@/lib/schemas/enums";

const selectClass =
  "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function AddFeedbackForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = fd.get(k);
      return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
    };
    const ratingStr = str("rating");

    startTransition(async () => {
      const res = await addApplicationFeedback({
        applicationId,
        round: str("round"),
        rating: ratingStr ? Number(ratingStr) : undefined,
        recommendation: str("recommendation") as (typeof RECOMMENDATIONS)[number] | undefined,
        strengths: str("strengths"),
        concerns: str("concerns"),
        comments: str("comments"),
      });
      if (res.ok) {
        toast.success("Feedback recorded");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-4" />
        Add feedback
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Round</label>
          <Input name="round" placeholder="e.g. Technical 1" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Rating</label>
          <select name="rating" className={selectClass} defaultValue="">
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Recommendation</label>
          <select name="recommendation" className={selectClass} defaultValue="">
            <option value="">—</option>
            {RECOMMENDATIONS.map((r) => (
              <option key={r} value={r}>
                {RECOMMENDATION_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Textarea name="strengths" rows={2} placeholder="Strengths" />
      <Textarea name="concerns" rows={2} placeholder="Concerns" />
      <Textarea name="comments" rows={2} placeholder="Additional comments" />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save feedback"}
        </Button>
      </div>
    </form>
  );
}
