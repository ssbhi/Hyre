"use client";

import { Check, X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { rejectApplication, shortlistApplication } from "@/lib/actions/pipeline";
import { Button } from "@/components/ui/button";

/**
 * One-click Shortlist / Reject for a candidate, used in the dashboard
 * "needs attention" list. Mirrors the quick triage actions HR expects.
 */
export function QuickActions({
  applicationId,
  candidateName,
}: {
  applicationId: string;
  candidateName: string;
}) {
  const [pending, startTransition] = useTransition();

  function run(kind: "shortlist" | "reject") {
    startTransition(async () => {
      const res =
        kind === "shortlist"
          ? await shortlistApplication(applicationId)
          : await rejectApplication(applicationId);
      if (res.ok) {
        toast.success(
          kind === "shortlist"
            ? `${candidateName} shortlisted`
            : `${candidateName} rejected`,
        );
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run("shortlist")}
        className="text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400"
      >
        <Check className="size-3.5" />
        Shortlist
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run("reject")}
        className="text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400"
      >
        <X className="size-3.5" />
        Reject
      </Button>
    </div>
  );
}
