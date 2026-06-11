/**
 * The storage contract for Hyre.
 *
 * Every feature talks to the app through this interface — never to Prisma or a
 * spreadsheet directly. Today the only implementation is Prisma/SQLite
 * (adapters/prisma-repository.ts). A Google Sheets adapter and a Postgres
 * adapter can be dropped in later without touching a single page or action.
 */
import type {
  ApplicationInput,
  FeedbackInput,
  JobInput,
  NoteInput,
  ReferralInput,
  ReferralStatusUpdate,
  Role,
  StageUpdate,
  UserInput,
} from "@/lib/schemas";

import type {
  AnalyticsData,
  ApplicationDetail,
  ApplicationRecord,
  CandidatePipelineFilter,
  CandidateRecord,
  DashboardStats,
  JobFilter,
  JobRecord,
  ReferralRecord,
  UserRecord,
} from "./types";

export interface HyreRepository {
  // --- Jobs ---------------------------------------------------------------
  listJobs(filter?: JobFilter): Promise<JobRecord[]>;
  listPublishedJobs(filter?: JobFilter): Promise<JobRecord[]>;
  listDepartments(): Promise<string[]>;
  getJobById(id: string): Promise<JobRecord | null>;
  getJobBySlug(slug: string): Promise<JobRecord | null>;
  createJob(input: JobInput): Promise<JobRecord>;
  updateJob(id: string, input: JobInput): Promise<JobRecord>;
  setJobStatus(id: string, status: JobRecord["status"]): Promise<JobRecord>;
  duplicateJob(id: string): Promise<JobRecord>;

  // --- Candidates ---------------------------------------------------------
  getCandidateById(id: string): Promise<CandidateRecord | null>;
  getCandidateByEmail(email: string): Promise<CandidateRecord | null>;

  // --- Applications / pipeline -------------------------------------------
  listPipeline(filter?: CandidatePipelineFilter): Promise<ApplicationRecord[]>;
  getApplicationDetail(id: string): Promise<ApplicationDetail | null>;
  /** Career-portal apply: upserts the candidate, then creates the application. */
  applyToJob(input: ApplicationInput): Promise<ApplicationRecord>;
  moveStage(input: StageUpdate, actorId?: string): Promise<ApplicationRecord>;
  assignRecruiter(applicationId: string, recruiterId: string | null): Promise<ApplicationRecord>;
  addNote(input: NoteInput, authorId?: string): Promise<void>;
  addFeedback(input: FeedbackInput, interviewerId?: string): Promise<void>;

  // --- Referrals ----------------------------------------------------------
  listReferrals(): Promise<ReferralRecord[]>;
  listReferralsByReferrer(referrerId: string): Promise<ReferralRecord[]>;
  createReferral(input: ReferralInput, referrerId: string): Promise<ReferralRecord>;
  updateReferralStatus(input: ReferralStatusUpdate): Promise<ReferralRecord>;

  // --- Users --------------------------------------------------------------
  listUsers(): Promise<UserRecord[]>;
  listUsersByRole(role: Role): Promise<UserRecord[]>;
  getUserById(id: string): Promise<UserRecord | null>;
  getUserByEmail(email: string): Promise<UserRecord | null>;
  upsertUser(input: UserInput): Promise<UserRecord>;
  /** Create a user with an optional password hash (used by candidate signup). */
  createUser(input: {
    name: string;
    email: string;
    role: Role;
    passwordHash?: string | null;
  }): Promise<UserRecord>;
  /** Returns the user if email + password match, else null. */
  verifyCredentials(email: string, password: string): Promise<UserRecord | null>;

  // --- Dashboard & analytics ---------------------------------------------
  getDashboardStats(): Promise<DashboardStats>;
  getAnalytics(): Promise<AnalyticsData>;
}
