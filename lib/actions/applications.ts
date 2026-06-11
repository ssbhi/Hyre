"use server";

import { revalidatePath } from "next/cache";

import { repo } from "@/lib/data";
import { storage } from "@/lib/storage";
import { applicationInputSchema } from "@/lib/schemas";

export type ApplyResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Public career-portal submission. Saves the resume, upserts the candidate, files the application. */
export async function submitApplication(formData: FormData): Promise<ApplyResult> {
  // Read a text field, treating empty/whitespace as "not provided".
  const get = (key: string): string | undefined => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
  };

  const skillsRaw = get("skills");
  const skills = skillsRaw
    ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Handle the resume upload first (if any).
  let resumeUrl: string | undefined;
  const resume = formData.get("resume");
  if (resume instanceof File && resume.size > 0) {
    try {
      const saved = await storage.save(resume);
      resumeUrl = saved.url;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Resume upload failed." };
    }
  }

  const input = {
    jobId: get("jobId") ?? "",
    name: get("name") ?? "",
    email: get("email") ?? "",
    phone: get("phone"),
    location: get("location"),
    currentEmployer: get("currentEmployer"),
    currentTitle: get("currentTitle"),
    totalExperienceYears: get("totalExperienceYears"),
    noticePeriodDays: get("noticePeriodDays"),
    currentCtc: get("currentCtc"),
    expectedCtc: get("expectedCtc"),
    linkedinUrl: get("linkedinUrl"),
    portfolioUrl: get("portfolioUrl"),
    coverNote: get("coverNote"),
    skills,
    resumeUrl,
  };

  const parsed = applicationInputSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const k in flat) {
      const v = flat[k as keyof typeof flat];
      if (v && v[0]) fieldErrors[k] = v[0];
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  // Guard against applying to a non-existent or unpublished role.
  const job = await repo.getJobById(parsed.data.jobId);
  if (!job || job.status !== "PUBLISHED") {
    return { ok: false, error: "This role is no longer accepting applications." };
  }

  await repo.applyToJob(parsed.data);
  revalidatePath("/dashboard");
  revalidatePath(`/jobs/${parsed.data.jobId}`);
  return { ok: true };
}
