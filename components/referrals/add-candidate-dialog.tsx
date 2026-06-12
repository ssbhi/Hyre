"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { addCandidateOrReferral } from "@/lib/actions/referrals";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const field =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
const labelCls = "text-sm font-semibold text-slate-700";

export function AddCandidateDialog({
  jobs,
  defaultSource = "DIRECT",
  className,
  children,
}: {
  jobs: { id: string; title: string }[];
  defaultSource?: "DIRECT" | "REFERRAL";
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addCandidateOrReferral(fd);
      if (res.ok) {
        toast.success("Candidate added");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Couldn't save the candidate.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={className}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Add candidate / referral</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="ac-name" className={labelCls}>Full name</label>
            <input id="ac-name" name="name" required placeholder="Candidate name" className={field} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="ac-email" className={labelCls}>Email</label>
              <input id="ac-email" name="email" type="email" required placeholder="name@email.com" className={field} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ac-phone" className={labelCls}>Phone</label>
              <input id="ac-phone" name="phone" placeholder="Optional" className={field} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ac-job" className={labelCls}>Applying for</label>
            <select id="ac-job" name="jobId" defaultValue={jobs[0]?.id ?? ""} className={field}>
              {jobs.length === 0 && <option value="">No open roles</option>}
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ac-source" className={labelCls}>Source</label>
            <select id="ac-source" name="source" defaultValue={defaultSource} className={field}>
              <option value="DIRECT">Direct</option>
              <option value="REFERRAL">Referral</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ac-notes" className={labelCls}>Notes</label>
            <textarea
              id="ac-notes"
              name="comment"
              rows={3}
              placeholder="Optional — résumé link, context, etc."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <button
            type="submit"
            disabled={pending || jobs.length === 0}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save candidate"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
