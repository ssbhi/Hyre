"use client";

import { CheckCircle2, Paperclip } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { applyToJobs } from "@/lib/actions/applications";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function MultiApplyForm({
  jobs,
  user,
}: {
  jobs: { id: string; title: string }[];
  user: { name: string; email: string };
}) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<number | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    startTransition(async () => {
      const res = await applyToJobs(fd);
      if (res.ok) {
        setDone(res.count);
        toast.success(`Applied to ${res.count} role${res.count === 1 ? "" : "s"}!`);
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  }

  if (done != null) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">
          Applied to {done} role{done === 1 ? "" : "s"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Thanks, {user.name.split(" ")[0]}! Our team will review your profile and be in touch.
        </p>
        <Link href="/careers" className={cn(buttonVariants({ variant: "outline" }), "mt-6")}>
          Browse more roles
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="jobIds" value={jobs.map((j) => j.id).join(",")} />

      {/* Roles being applied to */}
      <div className="rounded-xl border bg-muted/30 p-4">
        <p className="text-sm font-medium">
          Applying to {jobs.length} role{jobs.length === 1 ? "" : "s"}
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {jobs.map((j) => (
            <li key={j.id} className="rounded-full bg-background px-2.5 py-1 text-xs font-medium">
              {j.title}
            </li>
          ))}
        </ul>
      </div>

      {/* Identity (from account, locked) */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name">
          <Input id="name" value={user.name} disabled />
        </Field>
        <Field label="Email" name="email">
          <Input id="email" value={user.email} disabled />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone" name="phone" error={errors.phone}>
          <Input id="phone" name="phone" />
        </Field>
        <Field label="Location" name="location" error={errors.location}>
          <Input id="location" name="location" placeholder="City, Country" />
        </Field>
        <Field label="Current title" name="currentTitle" error={errors.currentTitle}>
          <Input id="currentTitle" name="currentTitle" />
        </Field>
        <Field label="Current employer" name="currentEmployer" error={errors.currentEmployer}>
          <Input id="currentEmployer" name="currentEmployer" />
        </Field>
        <Field label="Years of experience" name="totalExperienceYears" error={errors.totalExperienceYears}>
          <Input id="totalExperienceYears" name="totalExperienceYears" type="number" min={0} step="0.5" />
        </Field>
        <Field label="Notice period (days)" name="noticePeriodDays" error={errors.noticePeriodDays}>
          <Input id="noticePeriodDays" name="noticePeriodDays" type="number" min={0} />
        </Field>
        <Field label="Current CTC" name="currentCtc" error={errors.currentCtc}>
          <Input id="currentCtc" name="currentCtc" placeholder="e.g. ₹25 LPA" />
        </Field>
        <Field label="Expected CTC" name="expectedCtc" error={errors.expectedCtc}>
          <Input id="expectedCtc" name="expectedCtc" placeholder="e.g. ₹35 LPA" />
        </Field>
        <Field label="LinkedIn URL" name="linkedinUrl" error={errors.linkedinUrl}>
          <Input id="linkedinUrl" name="linkedinUrl" placeholder="https://linkedin.com/in/…" aria-invalid={!!errors.linkedinUrl} />
        </Field>
        <Field label="Portfolio / website" name="portfolioUrl" error={errors.portfolioUrl}>
          <Input id="portfolioUrl" name="portfolioUrl" placeholder="https://…" aria-invalid={!!errors.portfolioUrl} />
        </Field>
      </div>

      <Field label="Key skills (comma separated)" name="skills" error={errors.skills}>
        <Input id="skills" name="skills" placeholder="React, TypeScript, Node.js" />
      </Field>

      <Field label="Resume (PDF or Word, max 10 MB)" name="resume" error={errors.resume}>
        <label
          htmlFor="resume"
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed bg-background px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Paperclip className="size-4" />
          <span>Attach your resume</span>
          <input
            id="resume"
            name="resume"
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
      </Field>

      <Field label="Cover note" name="coverNote" error={errors.coverNote}>
        <Textarea id="coverNote" name="coverNote" rows={4} placeholder="Anything you'd like us to know (optional)" />
      </Field>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Link href="/careers" className={cn(buttonVariants({ variant: "ghost" }))}>
          Cancel
        </Link>
        <Button type="submit" disabled={pending} className="px-6">
          {pending ? "Submitting…" : `Submit application${jobs.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </form>
  );
}
