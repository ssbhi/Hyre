"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import { storage } from "@/lib/storage";
import { referralInputSchema, REFERRAL_STATUSES, type ReferralStatus } from "@/lib/schemas";

export type ReferralResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

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
