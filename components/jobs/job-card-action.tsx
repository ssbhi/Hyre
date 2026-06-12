"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { setJobStatus } from "@/lib/actions/jobs";
import type { JobStatus } from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

/**
 * The single toggle button on a job-board card: "Close role" for an open
 * (published) role, "Reopen role" otherwise. Closing archives the role;
 * reopening publishes it. HR-only — the server action enforces the check.
 */
export function JobCardAction({ id, status }: { id: string; status: JobStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isOpen = status === "PUBLISHED";

  function toggle() {
    startTransition(async () => {
      const res = await setJobStatus(id, isOpen ? "ARCHIVED" : "PUBLISHED");
      if (res.ok) {
        toast.success(isOpen ? "Role closed" : "Role reopened");
        router.refresh();
      } else {
        toast.error(res.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
        "border-slate-200 text-slate-700 hover:bg-slate-50",
      )}
    >
      {isOpen ? "Close role" : "Reopen role"}
    </button>
  );
}
