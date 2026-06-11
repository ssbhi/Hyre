"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createJob, updateJob } from "@/lib/actions/jobs";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  LOCATION_TYPES,
  LOCATION_TYPE_LABELS,
  jobInputSchema,
  type JobInput,
} from "@/lib/schemas";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function JobForm({
  mode,
  jobId,
  defaultValues,
  departments,
}: {
  mode: "create" | "edit";
  jobId?: string;
  defaultValues?: Partial<JobInput>;
  departments: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [department, setDepartment] = useState(defaultValues?.department ?? "");
  const [employmentType, setEmploymentType] = useState(defaultValues?.employmentType ?? "FULL_TIME");
  const [locationType, setLocationType] = useState(defaultValues?.locationType ?? "ONSITE");
  const [location, setLocation] = useState(defaultValues?.location ?? "");
  const [openings, setOpenings] = useState(String(defaultValues?.openings ?? 1));
  const [status, setStatus] = useState(defaultValues?.status ?? "DRAFT");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [skills, setSkills] = useState<string[]>(defaultValues?.requiredSkills ?? []);
  const [skillInput, setSkillInput] = useState("");

  function addSkill(raw: string) {
    const value = raw.trim().replace(/,$/, "");
    if (!value) return;
    setSkills((prev) => (prev.some((s) => s.toLowerCase() === value.toLowerCase()) ? prev : [...prev, value]));
    setSkillInput("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      title,
      department,
      employmentType,
      locationType,
      location,
      openings: Number(openings),
      status,
      requiredSkills: skills,
      description,
    };

    const parsed = jobInputSchema.safeParse(input);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Record<string, string> = {};
      for (const k in flat) {
        const v = flat[k as keyof typeof flat];
        if (v && v[0]) next[k] = v[0];
      }
      setErrors(next);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setErrors({});
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createJob(parsed.data)
          : await updateJob(jobId!, parsed.data);

      if (res.ok) {
        toast.success(mode === "create" ? "Job created" : "Job updated");
        router.push("/jobs");
        router.refresh();
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Job title" htmlFor="title" error={errors.title}>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior Frontend Engineer"
          aria-invalid={!!errors.title}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Department" htmlFor="department" error={errors.department}>
          <Input
            id="department"
            list="departments"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Engineering"
            aria-invalid={!!errors.department}
          />
          <datalist id="departments">
            {departments.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>

        <Field label="Employment type" htmlFor="employmentType">
          <select
            id="employmentType"
            className={selectClass}
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as JobInput["employmentType"])}
          >
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EMPLOYMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Location" htmlFor="location" error={errors.location}>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Bengaluru, IN"
            aria-invalid={!!errors.location}
          />
        </Field>

        <Field label="Work arrangement" htmlFor="locationType">
          <select
            id="locationType"
            className={selectClass}
            value={locationType}
            onChange={(e) => setLocationType(e.target.value as JobInput["locationType"])}
          >
            {LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {LOCATION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Number of openings" htmlFor="openings" error={errors.openings}>
          <Input
            id="openings"
            type="number"
            min={1}
            value={openings}
            onChange={(e) => setOpenings(e.target.value)}
            aria-invalid={!!errors.openings}
          />
        </Field>

        <Field label="Status" htmlFor="status">
          <select
            id="status"
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as JobInput["status"])}
          >
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {JOB_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="What we're looking for"
        htmlFor="skills"
        error={errors.requiredSkills}
        hint="Skills applicants see under “What we're looking for”. Add the most relevant ones."
      >
        <div className="rounded-lg border bg-background p-2">
          {skills.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {s}
                  <button
                    type="button"
                    aria-label={`Remove ${s}`}
                    onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}
                    className="rounded-full hover:bg-primary/20"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            id="skills"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addSkill(skillInput);
              } else if (e.key === "Backspace" && !skillInput && skills.length) {
                setSkills((prev) => prev.slice(0, -1));
              }
            }}
            onBlur={() => addSkill(skillInput)}
            placeholder="Type a skill and press Enter"
            className="w-full bg-transparent px-1 text-sm outline-none"
          />
        </div>
      </Field>

      <Field
        label="About the role"
        htmlFor="description"
        error={errors.description}
        hint="Shown to applicants as the “About the role” section — describe the role, responsibilities, and expectations."
      >
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={10}
          placeholder="Describe the role, responsibilities, and what you're looking for…"
          aria-invalid={!!errors.description}
        />
      </Field>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Link href="/jobs" className={cn(buttonVariants({ variant: "ghost" }))}>
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create job" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
