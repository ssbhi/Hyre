/**
 * Canonical enums for Hyre.
 *
 * SQLite has no enum type, so these values are stored as plain strings and
 * validated here. Each enum ships with a display-label map and (where it helps
 * the UI) a tone used for badge colours. Keeping all of this in one place means
 * the pipeline definition has a single source of truth across DB, server, and UI.
 */

export const ROLES = ["HR_ADMIN", "EMPLOYEE", "CANDIDATE"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  HR_ADMIN: "HR Admin",
  EMPLOYEE: "Employee",
  CANDIDATE: "Candidate",
};

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "TEMPORARY",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
};

export const LOCATION_TYPES = ["ONSITE", "REMOTE", "HYBRID"] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  ONSITE: "On-site",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
};

export const JOB_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const CANDIDATE_SOURCES = [
  "CAREER_PORTAL",
  "REFERRAL",
  "MANUAL",
] as const;
export type CandidateSource = (typeof CANDIDATE_SOURCES)[number];

export const CANDIDATE_SOURCE_LABELS: Record<CandidateSource, string> = {
  CAREER_PORTAL: "Career portal",
  REFERRAL: "Referral",
  MANUAL: "Added manually",
};

/**
 * The ATS pipeline. Order matters — it drives the kanban column order and the
 * hiring funnel. `terminal` stages are end states that sit outside the funnel.
 */
export const PIPELINE_STAGES = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
  "OFFER_EXTENDED",
  "OFFER_ACCEPTED",
  "HIRED",
  "REJECTED",
  "ON_HOLD",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type StageTone = "neutral" | "info" | "progress" | "success" | "danger" | "warning";

export const STAGE_META: Record<
  PipelineStage,
  { label: string; tone: StageTone; terminal: boolean }
> = {
  APPLIED: { label: "Applied", tone: "neutral", terminal: false },
  SCREENING: { label: "Screening", tone: "info", terminal: false },
  SHORTLISTED: { label: "Shortlisted", tone: "info", terminal: false },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", tone: "progress", terminal: false },
  INTERVIEW_COMPLETED: { label: "Interview Completed", tone: "progress", terminal: false },
  OFFER_EXTENDED: { label: "Offer Extended", tone: "progress", terminal: false },
  OFFER_ACCEPTED: { label: "Offer Accepted", tone: "success", terminal: false },
  HIRED: { label: "Hired", tone: "success", terminal: true },
  REJECTED: { label: "Rejected", tone: "danger", terminal: true },
  ON_HOLD: { label: "On Hold", tone: "warning", terminal: true },
};

/** Stages that make up the visible kanban board (everything except the rejected pile). */
export const ACTIVE_PIPELINE_STAGES = PIPELINE_STAGES.filter(
  (s) => s !== "REJECTED" && s !== "ON_HOLD",
);

/** Ordered stages used to render the hiring funnel chart. */
export const FUNNEL_STAGES: PipelineStage[] = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "OFFER_EXTENDED",
  "HIRED",
];

export const REFERRAL_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "INTERVIEWING",
  "HIRED",
  "REJECTED",
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const REFERRAL_STATUS_META: Record<
  ReferralStatus,
  { label: string; tone: StageTone }
> = {
  SUBMITTED: { label: "Submitted", tone: "neutral" },
  UNDER_REVIEW: { label: "Under Review", tone: "info" },
  SHORTLISTED: { label: "Shortlisted", tone: "progress" },
  INTERVIEWING: { label: "Interviewing", tone: "progress" },
  HIRED: { label: "Hired", tone: "success" },
  REJECTED: { label: "Not Selected", tone: "danger" },
};

export const RECOMMENDATIONS = ["STRONG_YES", "YES", "NO", "STRONG_NO"] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

export const RECOMMENDATION_LABELS: Record<Recommendation, string> = {
  STRONG_YES: "Strong Yes",
  YES: "Yes",
  NO: "No",
  STRONG_NO: "Strong No",
};
