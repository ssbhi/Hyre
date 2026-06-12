"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { storage } from "@/lib/storage";
import {
  manualCandidateSchema,
  referralInputSchema,
  REFERRAL_STATUSES,
  type ReferralStatus,
} from "@/lib/schemas";

export type ReferralResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function fieldErrorsFrom(flat: Record<string, string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k in flat) {
    const v = flat[k];
    if (v && v[0]) out[k] = v[0];
  }
  return out;
}

/** Employee submits a referral. The referrer is the current user. */
export async function submitReferral(formData: FormData): Promise<ReferralResult> {
  const user = await getCurrentUser();

  const get = (k: string): string | undefined => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
  };

  let resumeUrl: string | undefined;
  const resume = formData.get("resume");
  if (resume instanceof File && resume.size > 0) {
    try {
      resumeUrl = (await storage.save(resume)).url;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Resume upload failed." };
    }
  }

  const input = {
    jobId: get("jobId") ?? "",
    candidateName: get("candidateName") ?? "",
    candidateEmail: get("candidateEmail") ?? "",
    candidatePhone: get("candidatePhone"),
    resumeUrl,
    linkedinUrl: get("linkedinUrl"),
    relationship: get("relationship"),
    comment: get("comment"),
  };

  const parsed = referralInputSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const k in flat) {
      const v = flat[k as keyof typeof flat];
      if (v && v[0]) fieldErrors[k] = v[0];
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const job = await repo.getJobById(parsed.data.jobId);
  if (!job || job.status !== "PUBLISHED") {
    return { ok: false, error: "That role isn't open for referrals." };
  }

  await repo.createReferral(parsed.data, user.id);
  revalidatePath("/referrals");
  revalidatePath("/dashboard");
  revalidatePath("/candidates");
  return { ok: true };
}

/**
 * Admin "Add candidate / referral" modal. Source = Direct adds the candidate
 * straight to the pipeline (MANUAL); Source = Referral logs a referral with the
 * current HR user as the referrer.
 */
export async function addCandidateOrReferral(formData: FormData): Promise<ReferralResult> {
  const user = await getCurrentUser();
  if (user.role !== "HR_ADMIN") {
    return { ok: false, error: "Only HR Admins can add candidates here." };
  }

  const get = (k: string): string | undefined => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
  };

  const source = (get("source") ?? "DIRECT").toUpperCase();
  const job = await repo.getJobById(get("jobId") ?? "");
  if (!job) return { ok: false, error: "Pick a role." };

  if (source === "REFERRAL") {
    const parsed = referralInputSchema.safeParse({
      jobId: get("jobId") ?? "",
      candidateName: get("name") ?? "",
      candidateEmail: get("email") ?? "",
      candidatePhone: get("phone"),
      comment: get("comment"),
    });
    if (!parsed.success) {
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.flatten().fieldErrors) };
    }
    await repo.createReferral(parsed.data, user.id);
  } else {
    const parsed = manualCandidateSchema.safeParse({
      jobId: get("jobId") ?? "",
      name: get("name") ?? "",
      email: get("email") ?? "",
      phone: get("phone"),
      comment: get("comment"),
    });
    if (!parsed.success) {
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.flatten().fieldErrors) };
    }
    await repo.addManualCandidate(parsed.data);
  }

  revalidatePath("/referrals");
  revalidatePath("/candidates");
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Public referral form (no login). Anyone can refer someone they know; the
 * referrer is found-or-created by email so it shows up in the admin Referrals
 * tab under "Referred by".
 */
export async function submitPublicReferral(formData: FormData): Promise<ReferralResult> {
  const get = (k: string): string | undefined => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
  };

  const referrerName = get("referrerName");
  const referrerEmail = get("referrerEmail")?.toLowerCase();
  if (!referrerName || referrerName.length < 2) {
    return { ok: false, error: "Enter your name.", fieldErrors: { referrerName: "Your name is required." } };
  }
  if (!referrerEmail || !EMAIL_RE.test(referrerEmail)) {
    return { ok: false, error: "Enter a valid email.", fieldErrors: { referrerEmail: "Enter a valid email." } };
  }

  let resumeUrl: string | undefined;
  const resume = formData.get("resume");
  if (resume instanceof File && resume.size > 0) {
    try {
      resumeUrl = (await storage.save(resume)).url;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Resume upload failed." };
    }
  }

  const parsed = referralInputSchema.safeParse({
    jobId: get("jobId") ?? "",
    candidateName: get("candidateName") ?? "",
    candidateEmail: get("candidateEmail") ?? "",
    candidatePhone: get("candidatePhone"),
    resumeUrl,
    linkedinUrl: get("linkedinUrl"),
    relationship: get("relationship"),
    comment: get("comment"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error.flatten().fieldErrors) };
  }

  const job = await repo.getJobById(parsed.data.jobId);
  if (!job || job.status !== "PUBLISHED") {
    return { ok: false, error: "That role isn't open for referrals." };
  }

  // Find or create the referrer (no password — they don't log in).
  const referrer =
    (await repo.getUserByEmail(referrerEmail)) ??
    (await repo.createUser({ name: referrerName, email: referrerEmail, role: "EMPLOYEE" }));

  await repo.createReferral(parsed.data, referrer.id);
  revalidatePath("/referrals");
  revalidatePath("/dashboard");
  revalidatePath("/candidates");
  return { ok: true };
}

/** HR updates a referral's status. */
export async function setReferralStatus(
  referralId: string,
  status: ReferralStatus,
): Promise<ReferralResult> {
  const user = await getCurrentUser();
  if (user.role !== "HR_ADMIN") {
    return { ok: false, error: "Only HR Admins can update referral status." };
  }
  if (!(REFERRAL_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "Invalid status." };
  }

  await repo.updateReferralStatus({ referralId, status });
  revalidatePath("/referrals");
  return { ok: true };
}
