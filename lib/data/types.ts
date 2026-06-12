/**
 * Domain record types returned by the data layer.
 *
 * These are intentionally plain, JSON-serialisable shapes — NOT Prisma models.
 * The Prisma adapter maps rows into these; a future Google Sheets or Postgres
 * adapter must produce the same shapes. UI and server code depend only on these
 * types, never on `@prisma/client`, which is what keeps the storage swappable.
 */
import type {
  CandidateSource,
  EmploymentType,
  JobStatus,
  LocationType,
  PipelineStage,
  Recommendation,
  ReferralStatus,
  Role,
} from "@/lib/schemas/enums";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: Role;
  title: string | null;
  department: string | null;
  avatarUrl: string | null;
}

export interface JobRecord {
  id: string;
  title: string;
  slug: string;
  department: string;
  employmentType: EmploymentType;
  location: string;
  locationType: LocationType;
  description: string;
  requiredSkills: string[];
  jdUrl: string | null;
  internalEligible: boolean;
  openings: number;
  status: JobStatus;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
  hiringManager: UserRecord | null;
  recruiter: UserRecord | null;
  /** Number of applications attached to this job (when the query asks for it). */
  applicantCount?: number;
}

export interface CandidateRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  currentEmployer: string | null;
  currentTitle: string | null;
  totalExperienceYears: number | null;
  noticePeriodDays: number | null;
  currentCtc: string | null;
  expectedCtc: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  resumeUrl: string | null;
  skills: string[];
  source: CandidateSource;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationRecord {
  id: string;
  stage: PipelineStage;
  coverNote: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
  jobId: string;
  candidateId: string;
  recruiter: UserRecord | null;
  job?: JobSummary;
  candidate?: CandidateRecord;
}

export interface JobSummary {
  id: string;
  title: string;
  department: string;
  slug: string;
}

export interface ReferralRecord {
  id: string;
  status: ReferralStatus;
  relationship: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  referrer: UserRecord;
  candidate: CandidateRecord;
  job: JobSummary;
  applicationId: string | null;
}

export interface NoteRecord {
  id: string;
  body: string;
  createdAt: string;
  author: UserRecord | null;
}

export interface StageEventRecord {
  id: string;
  fromStage: PipelineStage | null;
  toStage: PipelineStage;
  note: string | null;
  createdAt: string;
  changedBy: UserRecord | null;
}

export interface FeedbackRecord {
  id: string;
  round: string | null;
  rating: number | null;
  recommendation: Recommendation | null;
  strengths: string | null;
  concerns: string | null;
  comments: string | null;
  createdAt: string;
  interviewer: UserRecord | null;
}

/** A candidate application with its full activity trail — the profile/detail view. */
export interface ApplicationDetail extends ApplicationRecord {
  job: JobSummary;
  candidate: CandidateRecord;
  notes: NoteRecord[];
  stageEvents: StageEventRecord[];
  feedback: FeedbackRecord[];
}

// --- query option shapes ---------------------------------------------------

export interface JobFilter {
  status?: JobStatus;
  department?: string;
  search?: string;
}

export interface CandidatePipelineFilter {
  jobId?: string;
  stage?: PipelineStage;
  recruiterId?: string;
  search?: string;
}

// --- dashboard analytics ---------------------------------------------------

export interface AnalyticsData {
  totals: { applications: number; hired: number; openPositions: number; candidates: number };
  funnel: { stage: PipelineStage; label: string; count: number }[];
  stageCounts: { stage: PipelineStage; label: string; count: number }[];
  sourceBreakdown: { source: string; label: string; count: number }[];
  byDepartment: { department: string; count: number }[];
  topReferrers: { name: string; total: number; hired: number }[];
  avgTimeToHireDays: number | null;
  referralConversionRate: number;
}

export interface DashboardStats {
  openPositions: number;
  totalApplications: number;
  hiredThisMonth: number;
  activeReferrals: number;
  stageCounts: { stage: PipelineStage; count: number }[];
  funnel: { stage: PipelineStage; label: string; count: number }[];
  referralConversionRate: number; // 0..1
}
