"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { jobInputSchema, type JobInput, type JobStatus } from "@/lib/schemas";

export type JobActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function firstFieldErrors(err: z.ZodError): Record<string, string> {
  const flat = err.flatten().fieldErrors;
  const out: Record<string, string> = {};
  for (const key in flat) {
    const msgs = flat[key as keyof typeof flat];
    if (msgs && msgs[0]) out[key] = msgs[0];
  }
  return out;
}

/** Job mutations are HR-only. Returns the user when allowed, else an error. */
async function requireHrAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user.role !== "HR_ADMIN") {
    return { ok: false, error: "Only HR Admins can manage jobs." };
  }
  return { ok: true };
}

function revalidateJobs() {
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function createJob(input: JobInput): Promise<JobActionResult> {
  const auth = await requireHrAdmin();
  if (!auth.ok) return auth;

  const parsed = jobInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: firstFieldErrors(parsed.error) };
  }

  const job = await repo.createJob(parsed.data);
  revalidateJobs();
  return { ok: true, id: job.id };
}

export async function updateJob(id: string, input: JobInput): Promise<JobActionResult> {
  const auth = await requireHrAdmin();
  if (!auth.ok) return auth;

  const parsed = jobInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: firstFieldErrors(parsed.error) };
  }

  const job = await repo.updateJob(id, parsed.data);
  revalidateJobs();
  revalidatePath(`/jobs/${id}`);
  return { ok: true, id: job.id };
}

export async function setJobStatus(id: string, status: JobStatus): Promise<JobActionResult> {
  const auth = await requireHrAdmin();
  if (!auth.ok) return auth;

  const job = await repo.setJobStatus(id, status);
  revalidateJobs();
  revalidatePath(`/jobs/${id}`);
  return { ok: true, id: job.id };
}

export async function duplicateJob(id: string): Promise<JobActionResult> {
  const auth = await requireHrAdmin();
  if (!auth.ok) return auth;

  const job = await repo.duplicateJob(id);
  revalidateJobs();
  return { ok: true, id: job.id };
}
