/**
 * Google Sheets adapter — skeleton.
 *
 * This proves the storage seam: `SheetsRepository implements HyreRepository`, so
 * it can be selected by the factory (DATA_SOURCE=sheets) without any feature
 * code changing. The method bodies are intentionally unimplemented for the MVP.
 *
 * Implementation plan (Phase 1.5):
 *  - Auth with a Google service account (googleapis) shared on the target sheet.
 *  - One tab per entity (Jobs, Candidates, Applications, Referrals, Users, …),
 *    column order mirroring lib/data/types.ts; skills stored as JSON in a cell.
 *  - Reads: `spreadsheets.values.get`; writes: `append` / `batchUpdate`.
 *  - Generate ids client-side (cuid) so rows are stable without a DB.
 *  - Cache reads briefly (the existing Apps Script tools show Sheets latency is
 *    the main risk) — see repository docs.
 *
 * Until then every method throws, which is safe: the factory defaults to Prisma.
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

import type { HyreRepository } from "../repository";
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
} from "../types";

function notImplemented(method: string): never {
  throw new Error(
    `SheetsRepository.${method} is not implemented yet. Set DATA_SOURCE=prisma (default) for now.`,
  );
}

export class SheetsRepository implements HyreRepository {
  listJobs(_filter?: JobFilter): Promise<JobRecord[]> {
    return notImplemented("listJobs");
  }
  listPublishedJobs(_filter?: JobFilter): Promise<JobRecord[]> {
    return notImplemented("listPublishedJobs");
  }
  listDepartments(): Promise<string[]> {
    return notImplemented("listDepartments");
  }
  getJobById(_id: string): Promise<JobRecord | null> {
    return notImplemented("getJobById");
  }
  getJobBySlug(_slug: string): Promise<JobRecord | null> {
    return notImplemented("getJobBySlug");
  }
  createJob(_input: JobInput): Promise<JobRecord> {
    return notImplemented("createJob");
  }
  updateJob(_id: string, _input: JobInput): Promise<JobRecord> {
    return notImplemented("updateJob");
  }
  setJobStatus(_id: string, _status: JobRecord["status"]): Promise<JobRecord> {
    return notImplemented("setJobStatus");
  }
  duplicateJob(_id: string): Promise<JobRecord> {
    return notImplemented("duplicateJob");
  }
  getCandidateById(_id: string): Promise<CandidateRecord | null> {
    return notImplemented("getCandidateById");
  }
  getCandidateByEmail(_email: string): Promise<CandidateRecord | null> {
    return notImplemented("getCandidateByEmail");
  }
  listPipeline(_filter?: CandidatePipelineFilter): Promise<ApplicationRecord[]> {
    return notImplemented("listPipeline");
  }
  getApplicationDetail(_id: string): Promise<ApplicationDetail | null> {
    return notImplemented("getApplicationDetail");
  }
  applyToJob(_input: ApplicationInput): Promise<ApplicationRecord> {
    return notImplemented("applyToJob");
  }
  moveStage(_input: StageUpdate, _actorId?: string): Promise<ApplicationRecord> {
    return notImplemented("moveStage");
  }
  assignRecruiter(_applicationId: string, _recruiterId: string | null): Promise<ApplicationRecord> {
    return notImplemented("assignRecruiter");
  }
  addNote(_input: NoteInput, _authorId?: string): Promise<void> {
    return notImplemented("addNote");
  }
  addFeedback(_input: FeedbackInput, _interviewerId?: string): Promise<void> {
    return notImplemented("addFeedback");
  }
  listReferrals(): Promise<ReferralRecord[]> {
    return notImplemented("listReferrals");
  }
  listReferralsByReferrer(_referrerId: string): Promise<ReferralRecord[]> {
    return notImplemented("listReferralsByReferrer");
  }
  createReferral(_input: ReferralInput, _referrerId: string): Promise<ReferralRecord> {
    return notImplemented("createReferral");
  }
  updateReferralStatus(_input: ReferralStatusUpdate): Promise<ReferralRecord> {
    return notImplemented("updateReferralStatus");
  }
  listUsers(): Promise<UserRecord[]> {
    return notImplemented("listUsers");
  }
  listUsersByRole(_role: Role): Promise<UserRecord[]> {
    return notImplemented("listUsersByRole");
  }
  getUserById(_id: string): Promise<UserRecord | null> {
    return notImplemented("getUserById");
  }
  getUserByEmail(_email: string): Promise<UserRecord | null> {
    return notImplemented("getUserByEmail");
  }
  upsertUser(_input: UserInput): Promise<UserRecord> {
    return notImplemented("upsertUser");
  }
  createUser(_input: {
    name: string;
    email: string;
    role: Role;
    passwordHash?: string | null;
  }): Promise<UserRecord> {
    return notImplemented("createUser");
  }
  verifyCredentials(_email: string, _password: string): Promise<UserRecord | null> {
    return notImplemented("verifyCredentials");
  }
  getDashboardStats(): Promise<DashboardStats> {
    return notImplemented("getDashboardStats");
  }
  getAnalytics(): Promise<AnalyticsData> {
    return notImplemented("getAnalytics");
  }
}
