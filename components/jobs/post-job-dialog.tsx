"use client";

import { Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createJobFromForm } from "@/lib/actions/jobs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS } from "@/lib/schemas/enums";

const field = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40";
const labelCls = "text-sm font-semibold text-slate-700";

export function PostJobDialog({
  className,
  children,
}: {
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
      const res = await createJobFromForm(fd);
      if (res.ok) {
        toast.success("Job published");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Couldn't publish the job.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={className}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Post a job</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <label htmlFor="pj-title" className={labelCls}>Job title</label>
            <input id="pj-title" name="title" required placeholder="e.g. Backend Engineer" className={field} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pj-dept" className={labelCls}>Department</label>
            <input id="pj-dept" name="department" required placeholder="e.g. Engineering" className={field} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pj-loc" className={labelCls}>Location</label>
            <input id="pj-loc" name="location" required placeholder="e.g. Remote (India)" className={field} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="pj-type" className={labelCls}>Type</label>
              <select id="pj-type" name="employmentType" defaultValue="FULL_TIME" className={field}>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{EMPLOYMENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pj-openings" className={labelCls}>Openings</label>
              <input id="pj-openings" name="openings" type="number" min={1} defaultValue={1} className={field} />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
            <input type="checkbox" name="internalEligible" defaultChecked className="size-4 rounded border-slate-300 text-violet-600 focus-visible:ring-violet-500/40" />
            Internal candidates can apply
          </label>

          <div className="space-y-1.5">
            <label htmlFor="pj-skills" className={labelCls}>Skills required</label>
            <input id="pj-skills" name="skills" placeholder="React, TypeScript, Node.js (comma separated)" className={field} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pj-desc" className={labelCls}>About the role</label>
            <textarea
              id="pj-desc"
              name="description"
              rows={5}
              required
              placeholder="Describe the role, responsibilities, and what you're looking for…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Upload JD (optional)</label>
            <label
              htmlFor="pj-jd"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-500 transition-colors hover:border-violet-400 hover:text-slate-700"
            >
              <Paperclip className="size-4" />
              <span>Attach a JD (PDF or Word)</span>
              <input
                id="pj-jd"
                name="jd"
                type="file"
                accept=".pdf,.doc,.docx"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  const span = e.currentTarget.closest("label")?.querySelector("span");
                  if (span && f) span.textContent = f.name;
                }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-60"
          >
            {pending ? "Publishing…" : "Publish job"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
