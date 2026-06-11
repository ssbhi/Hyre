"use client";

import { Archive, Copy, MoreHorizontal, Pencil, Send, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { duplicateJob, setJobStatus } from "@/lib/actions/jobs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import type { JobStatus } from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

export function JobRowActions({ id, status }: { id: string; status: JobStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        router.refresh();
      } else {
        toast.error(res.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Job actions"
        disabled={pending}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem render={<Link href={`/jobs/${id}/edit`} />}>
          <Pencil />
          Edit
        </DropdownMenuItem>

        {status === "PUBLISHED" ? (
          <DropdownMenuItem onClick={() => run(() => setJobStatus(id, "DRAFT"), "Job unpublished")}>
            <Undo2 />
            Unpublish
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => run(() => setJobStatus(id, "PUBLISHED"), "Job published")}>
            <Send />
            Publish
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => run(() => duplicateJob(id), "Job duplicated as a draft")}>
          <Copy />
          Duplicate
        </DropdownMenuItem>

        {status !== "ARCHIVED" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => run(() => setJobStatus(id, "ARCHIVED"), "Job archived")}
            >
              <Archive />
              Archive
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
