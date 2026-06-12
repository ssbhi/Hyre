"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { storage } from "@/lib/storage";
import { applicationInputSchema } from "@/lib/schemas";
import {
  fileToSheetResume,
  isSheetSyncEnabled,
  syncApplicantToSheet,
} from "@/lib/sheets/client";

export type ApplyResult =
  | { ok: true; count: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Candidate applies to one or more roles in a single submission.
 *
 * Requires a signed-in candidate (the careers/apply page gates this). The
 * applicant's identity (name + email) comes from their account — not the form —
 * so applications always tie back to the logged-in candidate.
 */
export async function applyToJobs(formData: FormData): Promise<ApplyResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in to apply." };

  const get = (key: string): string | undefined => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
  };

  const jobIds = (get("jobIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (jobIds.length === 0) return { ok: false, error: "No roles selected." };

  const skillsRaw = get("skills");
  const skills = skillsRaw ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  let resumeUrl: string | undefined;
  const resume = formData.get("resume");
  if (resume instanceof File && resume.size > 0) {
    const isPdf =
      resume.type === "application/pdf" || resume.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return { ok: false, error: "Resume must be a PDF file." };
    }
    try {
      resumeUrl = (await storage.save(resume)).url;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Resume upload failed." };
    }
  }

  const base = {
    name: user.name,
    email: user.email,
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

  let applied = 0;
  const appliedTitles: string[] = [];
  let validatedInput: import("@/lib/schemas").ApplicationInput | undefined;
  for (const jobId of jobIds) {
    const job = await repo.getJobById(jobId);
    if (!job || job.status !== "PUBLISHED") continue;

    const parsed = applicationInputSchema.safeParse({ ...base, jobId });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const fieldErrors: Record<string, string> = {};
      for (const k in flat) {
        const v = flat[k as keyof typeof flat];
        if (v && v[0]) fieldErrors[k] = v[0];
      }
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
    }
    await repo.applyToJob(parsed.data);
    validatedInput = parsed.data;
    appliedTitles.push(job.title);
    applied += 1;
  }

  if (applied === 0) {
    return { ok: false, error: "Those roles are no longer accepting applications." };
  }

  // Mirror the applicant into the Google Sheet backend (best-effort). A sheet
  // failure must never break the application the candidate just submitted.
  if (validatedInput && isSheetSyncEnabled()) {
    try {
      const sheetResume =
        resume instanceof File && resume.size > 0 ? await fileToSheetResume(resume) : undefined;
      const result = await syncApplicantToSheet({
        name: validatedInput.name,
        email: validatedInput.email,
        phone: validatedInput.phone,
        location: validatedInput.location,
        currentEmployer: validatedInput.currentEmployer,
        currentTitle: validatedInput.currentTitle,
        totalExperienceYears: validatedInput.totalExperienceYears,
        noticePeriodDays: validatedInput.noticePeriodDays,
        currentCtc: validatedInput.currentCtc,
        expectedCtc: validatedInput.expectedCtc,
        linkedinUrl: validatedInput.linkedinUrl,
        portfolioUrl: validatedInput.portfolioUrl,
        skills: validatedInput.skills,
        coverNote: validatedInput.coverNote,
        rolesApplied: appliedTitles,
        resume: sheetResume,
      });
      if (!result.ok) console.error("[sheets] applicant sync failed:", result.error);
    } catch (e) {
      console.error("[sheets] applicant sync threw:", e);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/candidates");
  return { ok: true, count: applied };
}
