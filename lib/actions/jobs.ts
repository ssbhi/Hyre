"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { storage } from "@/lib/storage";
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

/**
 * Create a job from the "Post a job" modal (FormData), including an optional
 * uploaded JD file. Quick-post defaults: on-site, published.
 */
export async function createJobFromForm(formData: FormData): Promise<JobActionResult> {
  const auth = await requireHrAdmin();
  if (!auth.ok) return auth;

  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
  };

  let jdUrl: string | undefined;
  const jd = formData.get("jd");
  if (jd instanceof File && jd.size > 0) {
    try {
      jdUrl = (await storage.save(jd)).url;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "JD upload failed." };
    }
  }

  const skillsRaw = get("skills");
  const input = {
    title: get("title") ?? "",
    department: get("department") ?? "",
    employmentType: get("employmentType") ?? "FULL_TIME",
    location: get("location") ?? "",
    locationType: "ONSITE",
    description: get("description") ?? "",
    requiredSkills: skillsRaw ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
    jdUrl,
    internalEligible: formData.get("internalEligible") != null,
    openings: get("openings") ?? "1",
    status: "PUBLISHED" as const,
  };

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

/** Upload a JD file and return its URL (used by the edit form to replace a JD). */
export async function uploadJd(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const auth = await requireHrAdmin();
  if (!auth.ok) return auth;

  const f = formData.get("jd");
  if (!(f instanceof File) || f.size === 0) return { ok: false, error: "No file selected." };
  try {
    const saved = await storage.save(f);
    return { ok: true, url: saved.url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "JD upload failed." };
  }
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
