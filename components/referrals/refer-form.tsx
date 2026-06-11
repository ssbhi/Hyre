"use client";

import { Paperclip } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { submitReferral } from "@/lib/actions/referrals";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function Field({
  label,
  name,
  error,
  required,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ReferForm({ jobs }: { jobs: { id: string; title: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    startTransition(async () => {
      const res = await submitReferral(fd);
      if (res.ok) {
        toast.success("Referral submitted — thank you!");
        router.push("/referrals");
        router.refresh();
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Role" name="jobId" error={errors.jobId} required>
        <select id="jobId" name="jobId" className={selectClass} defaultValue="">
          <option value="" disabled>
            Select a role to refer for…
          </option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Candidate name" name="candidateName" error={errors.candidateName} required>
          <Input id="candidateName" name="candidateName" required aria-invalid={!!errors.candidateName} />
        </Field>
        <Field label="Candidate email" name="candidateEmail" error={errors.candidateEmail} required>
          <Input id="candidateEmail" name="candidateEmail" type="email" required aria-invalid={!!errors.candidateEmail} />
        </Field>
        <Field label="Candidate phone" name="candidatePhone" error={errors.candidatePhone}>
          <Input id="candidatePhone" name="candidatePhone" />
        </Field>
        <Field label="LinkedIn URL" name="linkedinUrl" error={errors.linkedinUrl}>
          <Input id="linkedinUrl" name="linkedinUrl" placeholder="https://linkedin.com/in/…" aria-invalid={!!errors.linkedinUrl} />
        </Field>
      </div>

      <Field label="How do you know them?" name="relationship" error={errors.relationship}>
        <Input id="relationship" name="relationship" placeholder="e.g. Former colleague at Acme" />
      </Field>

      <Field label="Why are they a great fit?" name="comment" error={errors.comment}>
        <Textarea id="comment" name="comment" rows={4} placeholder="Add a recommendation (optional)" />
      </Field>

      <Field label="Resume (PDF or Word, optional)" name="resume" error={errors.resume}>
        <label
          htmlFor="resume"
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed bg-background px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Paperclip className="size-4" />
          <span>Attach a resume</span>
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

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Link href="/referrals" className={cn(buttonVariants({ variant: "ghost" }))}>
          Cancel
        </Link>
        <Button type="submit" disabled={pending} className="px-6">
          {pending ? "Submitting…" : "Submit referral"}
        </Button>
      </div>
    </form>
  );
}
