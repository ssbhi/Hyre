"use client";

import { CheckCircle2, Paperclip } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { submitPublicReferral } from "@/lib/actions/referrals";

const field =
  "h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
const labelCls = "text-sm font-medium";

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function PublicReferForm({ jobs }: { jobs: { id: string; title: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    startTransition(async () => {
      const res = await submitPublicReferral(fd);
      if (res.ok) {
        setDone(true);
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <h2 className="mt-3 text-lg font-semibold">Referral submitted — thank you!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Our team will review it and reach out to your referral. You&apos;re helping us hire great
          people.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setDone(false)}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Refer someone else
          </button>
          <Link
            href="/careers"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Browse roles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border bg-card p-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Your details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" htmlFor="referrerName" required error={errors.referrerName}>
            <input id="referrerName" name="referrerName" required className={field} />
          </Field>
          <Field label="Your email" htmlFor="referrerEmail" required error={errors.referrerEmail}>
            <input id="referrerEmail" name="referrerEmail" type="email" required className={field} placeholder="you@company.com" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-muted-foreground">Who you&apos;re referring</legend>

        <Field label="Role they're a fit for" htmlFor="jobId" required error={errors.jobId}>
          <select id="jobId" name="jobId" required defaultValue="" className={field}>
            <option value="" disabled>Select a role…</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Candidate's name" htmlFor="candidateName" required error={errors.candidateName}>
            <input id="candidateName" name="candidateName" required className={field} />
          </Field>
          <Field label="Candidate's email" htmlFor="candidateEmail" required error={errors.candidateEmail}>
            <input id="candidateEmail" name="candidateEmail" type="email" required className={field} />
          </Field>
          <Field label="Candidate's phone" htmlFor="candidatePhone" error={errors.candidatePhone}>
            <input id="candidatePhone" name="candidatePhone" className={field} placeholder="Optional" />
          </Field>
          <Field label="LinkedIn" htmlFor="linkedinUrl" error={errors.linkedinUrl}>
            <input id="linkedinUrl" name="linkedinUrl" className={field} placeholder="https://linkedin.com/in/…" />
          </Field>
        </div>

        <Field label="How do you know them?" htmlFor="relationship" error={errors.relationship}>
          <input id="relationship" name="relationship" className={field} placeholder="e.g. Former colleague at Acme" />
        </Field>

        <Field label="Why are they a great fit?" htmlFor="comment" error={errors.comment}>
          <textarea
            id="comment"
            name="comment"
            rows={4}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            placeholder="A short recommendation (optional)"
          />
        </Field>

        <Field label="Resume (optional)" htmlFor="resume">
          <label
            htmlFor="resume"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed bg-background px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Paperclip className="size-4" />
            <span>Attach their resume (PDF or Word)</span>
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
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit referral"}
      </button>
    </form>
  );
}
