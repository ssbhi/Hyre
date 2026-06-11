/**
 * Zod schemas — the single source of truth for input validation.
 *
 * The same schema is imported by client forms (react-hook-form / manual) and by
 * server actions, so the server never trusts unvalidated input. Entity *records*
 * (what the data layer returns) are typed separately in lib/data/types.ts.
 */
import { z } from "zod";

import {
  CANDIDATE_SOURCES,
  EMPLOYMENT_TYPES,
  JOB_STATUSES,
  LOCATION_TYPES,
  PIPELINE_STAGES,
  RECOMMENDATIONS,
  REFERRAL_STATUSES,
  ROLES,
} from "./enums";

export * from "./enums";

// --- small reusable pieces ------------------------------------------------

/** Trim, and treat an empty string as "not provided". */
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

/** Optional URL that also tolerates an empty form field. */
const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional()
  .refine(
    (v) => v === undefined || /^https?:\/\/.+/.test(v),
    "Enter a valid URL (https://…)",
  );

const skills = z
  .array(z.string().trim().min(1))
  .max(40)
  .default([]);

// --- Job -------------------------------------------------------------------

export const jobInputSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(120),
  department: z.string().trim().min(1, "Department is required").max(80),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  location: z.string().trim().min(1, "Location is required").max(120),
  locationType: z.enum(LOCATION_TYPES),
  description: z.string().trim().min(20, "Add a fuller description").max(20000),
  requiredSkills: skills,
  openings: z.coerce.number().int().min(1).max(999).default(1),
  status: z.enum(JOB_STATUSES).default("DRAFT"),
  hiringManagerId: optionalText,
  recruiterId: optionalText,
});
export type JobInput = z.infer<typeof jobInputSchema>;

// --- Candidate + Application (career portal) -------------------------------

export const applicationInputSchema = z.object({
  jobId: z.string().min(1),
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: optionalText,
  location: optionalText,
  currentEmployer: optionalText,
  currentTitle: optionalText,
  totalExperienceYears: z.coerce.number().min(0).max(60).optional(),
  noticePeriodDays: z.coerce.number().int().min(0).max(365).optional(),
  currentCtc: optionalText,
  expectedCtc: optionalText,
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  resumeUrl: optionalText,
  skills: skills,
  coverNote: optionalText,
});
export type ApplicationInput = z.infer<typeof applicationInputSchema>;

// --- Referral (employee) ---------------------------------------------------

export const referralInputSchema = z.object({
  jobId: z.string().min(1, "Pick a role to refer for"),
  candidateName: z.string().trim().min(2, "Candidate name is required").max(120),
  candidateEmail: z.string().trim().toLowerCase().email("Enter a valid email"),
  candidatePhone: optionalText,
  resumeUrl: optionalText,
  linkedinUrl: optionalUrl,
  relationship: optionalText,
  comment: optionalText,
});
export type ReferralInput = z.infer<typeof referralInputSchema>;

// --- ATS actions -----------------------------------------------------------

export const stageUpdateSchema = z.object({
  applicationId: z.string().min(1),
  toStage: z.enum(PIPELINE_STAGES),
  note: optionalText,
});
export type StageUpdate = z.infer<typeof stageUpdateSchema>;

export const noteInputSchema = z.object({
  applicationId: z.string().min(1),
  body: z.string().trim().min(1, "Note can't be empty").max(5000),
});
export type NoteInput = z.infer<typeof noteInputSchema>;

export const feedbackInputSchema = z.object({
  applicationId: z.string().min(1),
  round: optionalText,
  rating: z.coerce.number().int().min(1).max(5).optional(),
  recommendation: z.enum(RECOMMENDATIONS).optional(),
  strengths: optionalText,
  concerns: optionalText,
  comments: optionalText,
});
export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

export const referralStatusUpdateSchema = z.object({
  referralId: z.string().min(1),
  status: z.enum(REFERRAL_STATUSES),
});
export type ReferralStatusUpdate = z.infer<typeof referralStatusUpdateSchema>;

// --- User ------------------------------------------------------------------

export const userInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(ROLES),
  title: optionalText,
  department: optionalText,
});
export type UserInput = z.infer<typeof userInputSchema>;

// Re-export so callers can `import { CANDIDATE_SOURCES } from "@/lib/schemas"`.
export { CANDIDATE_SOURCES };
