"use server";

import { revalidatePath } from "next/cache";

import { repo } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth/session";
import {
  feedbackInputSchema,
  noteInputSchema,
  stageUpdateSchema,
  type FeedbackInput,
  type PipelineStage,
} from "@/lib/schemas";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Move one application to a new pipeline stage, recording who did it. */
export async function moveCandidateStage(
  applicationId: string,
  toStage: PipelineStage,
  note?: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  const parsed = stageUpdateSchema.safeParse({ applicationId, toStage, note });
  if (!parsed.success) return { ok: false, error: "Invalid stage change." };

  await repo.moveStage(parsed.data, user.id);
  // Refresh server-rendered data across the workspace.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function shortlistApplication(applicationId: string): Promise<ActionResult> {
  return moveCandidateStage(applicationId, "SHORTLISTED");
}

export async function rejectApplication(applicationId: string): Promise<ActionResult> {
  return moveCandidateStage(applicationId, "REJECTED");
}

/** Add a recruiter note to an application. */
export async function addApplicationNote(applicationId: string, body: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  const parsed = noteInputSchema.safeParse({ applicationId, body });
  if (!parsed.success) return { ok: false, error: "Note can't be empty." };

  await repo.addNote(parsed.data, user.id);
  revalidatePath(`/candidates/${applicationId}`);
  return { ok: true };
}

/** Record interview feedback for an application. */
export async function addApplicationFeedback(input: FeedbackInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  const parsed = feedbackInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please complete the feedback form." };

  await repo.addFeedback(parsed.data, user.id);
  revalidatePath(`/candidates/${input.applicationId}`);
  return { ok: true };
}

/** Assign (or clear) the recruiter who owns an application. */
export async function assignRecruiter(
  applicationId: string,
  recruiterId: string | null,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (user.role !== "HR_ADMIN") return { ok: false, error: "Only HR Admins can assign recruiters." };

  await repo.assignRecruiter(applicationId, recruiterId);
  revalidatePath(`/candidates/${applicationId}`);
  revalidatePath("/candidates");
  return { ok: true };
}
