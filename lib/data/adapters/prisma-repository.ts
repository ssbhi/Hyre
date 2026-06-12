/**
 * Prisma/SQLite implementation of HyreRepository.
 *
 * All Prisma-specific knowledge lives here: relation includes, JSON (de)coding
 * of the string-backed array columns, enum string→union casts, and Date→ISO
 * serialisation. Everything returned conforms to lib/data/types.ts.
 */
import type { Prisma, User as PrismaUser, Candidate as PrismaCandidate } from "@prisma/client";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import {
  CANDIDATE_SOURCE_LABELS,
  FUNNEL_STAGES,
  PIPELINE_STAGES,
  STAGE_META,
} from "@/lib/schemas/enums";
import type {
  ApplicationInput,
  FeedbackInput,
  JobInput,
  ManualCandidateInput,
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

// --- helpers ---------------------------------------------------------------

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

function parseSkills(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function uniqueJobSlug(title: string): Promise<string> {
  const base = slugify(title) || "role";
  let slug = base;
  let n = 1;
  // Collisions are rare; a short suffix loop is fine at this scale.
  while (await prisma.job.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

// Happy-path ranking used to compute the hiring funnel (terminal stages = -1).
const HAPPY_PATH = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
  "OFFER_EXTENDED",
  "OFFER_ACCEPTED",
  "HIRED",
] as const;
const rankOf = (stage: string) => HAPPY_PATH.indexOf(stage as (typeof HAPPY_PATH)[number]);

// --- mappers ---------------------------------------------------------------

type UserRow = PrismaUser;
function mapUser(u: UserRow | null): UserRecord | null {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as Role,
    title: u.title,
    department: u.department,
    avatarUrl: u.avatarUrl,
  };
}

type JobRow = Prisma.JobGetPayload<{
  include: { hiringManager: true; recruiter: true; _count: { select: { applications: true } } };
}>;
function mapJob(j: JobRow): JobRecord {
  return {
    id: j.id,
    title: j.title,
    slug: j.slug,
    department: j.department,
    employmentType: j.employmentType as JobRecord["employmentType"],
    location: j.location,
    locationType: j.locationType as JobRecord["locationType"],
    description: j.description,
    requiredSkills: parseSkills(j.requiredSkills),
    jdUrl: j.jdUrl ?? null,
    internalEligible: j.internalEligible,
    openings: j.openings,
    status: j.status as JobRecord["status"],
    postedAt: iso(j.postedAt),
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
    hiringManager: mapUser(j.hiringManager),
    recruiter: mapUser(j.recruiter),
    applicantCount: j._count?.applications,
  };
}

const jobInclude = {
  hiringManager: true,
  recruiter: true,
  _count: { select: { applications: true } },
} satisfies Prisma.JobInclude;

type CandidateRow = PrismaCandidate;
function mapCandidate(c: CandidateRow): CandidateRecord {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    location: c.location,
    currentEmployer: c.currentEmployer,
    currentTitle: c.currentTitle,
    totalExperienceYears: c.totalExperienceYears,
    noticePeriodDays: c.noticePeriodDays,
    currentCtc: c.currentCtc,
    expectedCtc: c.expectedCtc,
    linkedinUrl: c.linkedinUrl,
    portfolioUrl: c.portfolioUrl,
    resumeUrl: c.resumeUrl,
    skills: parseSkills(c.skills),
    source: c.source as CandidateRecord["source"],
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

type ApplicationRow = Prisma.ApplicationGetPayload<{
  include: { recruiter: true; job: true; candidate: true };
}>;
function mapApplication(a: ApplicationRow): ApplicationRecord {
  return {
    id: a.id,
    stage: a.stage as ApplicationRecord["stage"],
    coverNote: a.coverNote,
    rejectedReason: a.rejectedReason,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    jobId: a.jobId,
    candidateId: a.candidateId,
    recruiter: mapUser(a.recruiter),
    job: a.job
      ? { id: a.job.id, title: a.job.title, department: a.job.department, slug: a.job.slug }
      : undefined,
    candidate: a.candidate ? mapCandidate(a.candidate) : undefined,
  };
}

type ReferralRow = Prisma.ReferralGetPayload<{
  include: { referrer: true; candidate: true; job: true };
}>;
function mapReferral(r: ReferralRow): ReferralRecord {
  return {
    id: r.id,
    status: r.status as ReferralRecord["status"],
    relationship: r.relationship,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    referrer: mapUser(r.referrer)!,
    candidate: mapCandidate(r.candidate),
    job: { id: r.job.id, title: r.job.title, department: r.job.department, slug: r.job.slug },
    applicationId: r.applicationId,
  };
}

// --- repository ------------------------------------------------------------

export class PrismaRepository implements HyreRepository {
  // Jobs --------------------------------------------------------------------

  async listJobs(filter: JobFilter = {}): Promise<JobRecord[]> {
    const where: Prisma.JobWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.department) where.department = filter.department;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search } },
        { department: { contains: filter.search } },
        { location: { contains: filter.search } },
      ];
    }
    const rows = await prisma.job.findMany({
      where,
      include: jobInclude,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(mapJob);
  }

  async listPublishedJobs(filter: JobFilter = {}): Promise<JobRecord[]> {
    return this.listJobs({ ...filter, status: "PUBLISHED" });
  }

  async listDepartments(): Promise<string[]> {
    const rows = await prisma.job.findMany({
      distinct: ["department"],
      select: { department: true },
      orderBy: { department: "asc" },
    });
    return rows.map((r) => r.department);
  }

  async getJobById(id: string): Promise<JobRecord | null> {
    const row = await prisma.job.findUnique({ where: { id }, include: jobInclude });
    return row ? mapJob(row) : null;
  }

  async getJobBySlug(slug: string): Promise<JobRecord | null> {
    const row = await prisma.job.findUnique({ where: { slug }, include: jobInclude });
    return row ? mapJob(row) : null;
  }

  async createJob(input: JobInput): Promise<JobRecord> {
    const slug = await uniqueJobSlug(input.title);
    const row = await prisma.job.create({
      data: {
        title: input.title,
        slug,
        department: input.department,
        employmentType: input.employmentType,
        location: input.location,
        locationType: input.locationType,
        description: input.description,
        requiredSkills: JSON.stringify(input.requiredSkills),
        jdUrl: input.jdUrl ?? null,
        internalEligible: input.internalEligible,
        openings: input.openings,
        status: input.status,
        postedAt: input.status === "PUBLISHED" ? new Date() : null,
        hiringManagerId: input.hiringManagerId ?? null,
        recruiterId: input.recruiterId ?? null,
      },
      include: jobInclude,
    });
    return mapJob(row);
  }

  async updateJob(id: string, input: JobInput): Promise<JobRecord> {
    const existing = await prisma.job.findUnique({ where: { id } });
    const row = await prisma.job.update({
      where: { id },
      data: {
        title: input.title,
        department: input.department,
        employmentType: input.employmentType,
        location: input.location,
        locationType: input.locationType,
        description: input.description,
        requiredSkills: JSON.stringify(input.requiredSkills),
        jdUrl: input.jdUrl ?? null,
        internalEligible: input.internalEligible,
        openings: input.openings,
        status: input.status,
        // Stamp postedAt the first time a job is published.
        postedAt:
          input.status === "PUBLISHED" && !existing?.postedAt ? new Date() : existing?.postedAt,
        hiringManagerId: input.hiringManagerId ?? null,
        recruiterId: input.recruiterId ?? null,
      },
      include: jobInclude,
    });
    return mapJob(row);
  }

  async setJobStatus(id: string, status: JobRecord["status"]): Promise<JobRecord> {
    const existing = await prisma.job.findUnique({ where: { id } });
    const row = await prisma.job.update({
      where: { id },
      data: {
        status,
        postedAt: status === "PUBLISHED" && !existing?.postedAt ? new Date() : existing?.postedAt,
      },
      include: jobInclude,
    });
    return mapJob(row);
  }

  async duplicateJob(id: string): Promise<JobRecord> {
    const src = await prisma.job.findUniqueOrThrow({ where: { id } });
    const title = `${src.title} (Copy)`;
    const slug = await uniqueJobSlug(title);
    const row = await prisma.job.create({
      data: {
        title,
        slug,
        department: src.department,
        employmentType: src.employmentType,
        location: src.location,
        locationType: src.locationType,
        description: src.description,
        requiredSkills: src.requiredSkills,
        jdUrl: src.jdUrl,
        internalEligible: src.internalEligible,
        openings: src.openings,
        status: "DRAFT",
        hiringManagerId: src.hiringManagerId,
        recruiterId: src.recruiterId,
      },
      include: jobInclude,
    });
    return mapJob(row);
  }

  // Candidates --------------------------------------------------------------

  async getCandidateById(id: string): Promise<CandidateRecord | null> {
    const row = await prisma.candidate.findUnique({ where: { id } });
    return row ? mapCandidate(row) : null;
  }

  async getCandidateByEmail(email: string): Promise<CandidateRecord | null> {
    const row = await prisma.candidate.findUnique({ where: { email: email.toLowerCase() } });
    return row ? mapCandidate(row) : null;
  }

  // Applications ------------------------------------------------------------

  async listPipeline(filter: CandidatePipelineFilter = {}): Promise<ApplicationRecord[]> {
    const where: Prisma.ApplicationWhereInput = {};
    if (filter.jobId) where.jobId = filter.jobId;
    if (filter.stage) where.stage = filter.stage;
    if (filter.recruiterId) where.recruiterId = filter.recruiterId;
    if (filter.search) {
      where.candidate = {
        OR: [
          { name: { contains: filter.search } },
          { email: { contains: filter.search } },
          // skills is a JSON text column, so a substring match finds skills too.
          { skills: { contains: filter.search } },
        ],
      };
    }
    const rows = await prisma.application.findMany({
      where,
      include: { recruiter: true, job: true, candidate: true },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(mapApplication);
  }

  async getApplicationDetail(id: string): Promise<ApplicationDetail | null> {
    const a = await prisma.application.findUnique({
      where: { id },
      include: {
        recruiter: true,
        job: true,
        candidate: true,
        notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
        stageEvents: { include: { changedBy: true }, orderBy: { createdAt: "desc" } },
        feedback: { include: { interviewer: true }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!a) return null;
    const base = mapApplication(a);
    return {
      ...base,
      job: base.job!,
      candidate: base.candidate!,
      notes: a.notes.map((n) => ({
        id: n.id,
        body: n.body,
        createdAt: n.createdAt.toISOString(),
        author: mapUser(n.author),
      })),
      stageEvents: a.stageEvents.map((s) => ({
        id: s.id,
        fromStage: (s.fromStage as ApplicationDetail["stage"]) ?? null,
        toStage: s.toStage as ApplicationDetail["stage"],
        note: s.note,
        createdAt: s.createdAt.toISOString(),
        changedBy: mapUser(s.changedBy),
      })),
      feedback: a.feedback.map((f) => ({
        id: f.id,
        round: f.round,
        rating: f.rating,
        recommendation: f.recommendation as FeedbackRecommendation,
        strengths: f.strengths,
        concerns: f.concerns,
        comments: f.comments,
        createdAt: f.createdAt.toISOString(),
        interviewer: mapUser(f.interviewer),
      })),
    };
  }

  async applyToJob(input: ApplicationInput): Promise<ApplicationRecord> {
    const email = input.email.toLowerCase();
    const candidate = await prisma.candidate.upsert({
      where: { email },
      create: {
        name: input.name,
        email,
        phone: input.phone,
        location: input.location,
        currentEmployer: input.currentEmployer,
        currentTitle: input.currentTitle,
        totalExperienceYears: input.totalExperienceYears,
        noticePeriodDays: input.noticePeriodDays,
        currentCtc: input.currentCtc,
        expectedCtc: input.expectedCtc,
        linkedinUrl: input.linkedinUrl,
        portfolioUrl: input.portfolioUrl,
        resumeUrl: input.resumeUrl,
        skills: JSON.stringify(input.skills ?? []),
        source: "CAREER_PORTAL",
      },
      update: {
        // Refresh contact details on re-application, but never downgrade source.
        name: input.name,
        phone: input.phone ?? undefined,
        currentEmployer: input.currentEmployer ?? undefined,
        currentTitle: input.currentTitle ?? undefined,
        resumeUrl: input.resumeUrl ?? undefined,
        linkedinUrl: input.linkedinUrl ?? undefined,
        portfolioUrl: input.portfolioUrl ?? undefined,
      },
    });

    const existing = await prisma.application.findUnique({
      where: { jobId_candidateId: { jobId: input.jobId, candidateId: candidate.id } },
      include: { recruiter: true, job: true, candidate: true },
    });
    if (existing) return mapApplication(existing);

    const created = await prisma.application.create({
      data: {
        jobId: input.jobId,
        candidateId: candidate.id,
        coverNote: input.coverNote,
        stage: "APPLIED",
        stageEvents: { create: { toStage: "APPLIED", note: "Applied via career portal" } },
      },
      include: { recruiter: true, job: true, candidate: true },
    });
    return mapApplication(created);
  }

  async addManualCandidate(input: ManualCandidateInput): Promise<ApplicationRecord> {
    const email = input.email.toLowerCase();
    const candidate = await prisma.candidate.upsert({
      where: { email },
      create: {
        name: input.name,
        email,
        phone: input.phone,
        skills: "[]",
        source: "MANUAL",
      },
      update: {
        name: input.name,
        phone: input.phone ?? undefined,
      },
    });

    const existing = await prisma.application.findUnique({
      where: { jobId_candidateId: { jobId: input.jobId, candidateId: candidate.id } },
      include: { recruiter: true, job: true, candidate: true },
    });
    if (existing) return mapApplication(existing);

    const created = await prisma.application.create({
      data: {
        jobId: input.jobId,
        candidateId: candidate.id,
        coverNote: input.comment,
        stage: "APPLIED",
        stageEvents: { create: { toStage: "APPLIED", note: "Added by HR" } },
      },
      include: { recruiter: true, job: true, candidate: true },
    });
    return mapApplication(created);
  }

  async moveStage(input: StageUpdate, actorId?: string): Promise<ApplicationRecord> {
    const current = await prisma.application.findUniqueOrThrow({ where: { id: input.applicationId } });
    const row = await prisma.application.update({
      where: { id: input.applicationId },
      data: {
        stage: input.toStage,
        stageEvents: {
          create: {
            fromStage: current.stage,
            toStage: input.toStage,
            note: input.note,
            changedById: actorId ?? null,
          },
        },
      },
      include: { recruiter: true, job: true, candidate: true },
    });
    // Keep a linked referral's status roughly in sync with the pipeline.
    await this.syncReferralStatus(input.applicationId, input.toStage);
    return mapApplication(row);
  }

  private async syncReferralStatus(applicationId: string, stage: string) {
    const referral = await prisma.referral.findUnique({ where: { applicationId } });
    if (!referral) return;
    const map: Record<string, string> = {
      SCREENING: "UNDER_REVIEW",
      SHORTLISTED: "SHORTLISTED",
      INTERVIEW_SCHEDULED: "INTERVIEWING",
      INTERVIEW_COMPLETED: "INTERVIEWING",
      HIRED: "HIRED",
      REJECTED: "REJECTED",
    };
    const next = map[stage];
    if (next && next !== referral.status) {
      await prisma.referral.update({ where: { id: referral.id }, data: { status: next } });
    }
  }

  async assignRecruiter(applicationId: string, recruiterId: string | null): Promise<ApplicationRecord> {
    const row = await prisma.application.update({
      where: { id: applicationId },
      data: { recruiterId },
      include: { recruiter: true, job: true, candidate: true },
    });
    return mapApplication(row);
  }

  async addNote(input: NoteInput, authorId?: string): Promise<void> {
    await prisma.note.create({
      data: { applicationId: input.applicationId, body: input.body, authorId: authorId ?? null },
    });
  }

  async addFeedback(input: FeedbackInput, interviewerId?: string): Promise<void> {
    await prisma.interviewFeedback.create({
      data: {
        applicationId: input.applicationId,
        round: input.round,
        rating: input.rating,
        recommendation: input.recommendation,
        strengths: input.strengths,
        concerns: input.concerns,
        comments: input.comments,
        interviewerId: interviewerId ?? null,
      },
    });
  }

  // Referrals ---------------------------------------------------------------

  async listReferrals(): Promise<ReferralRecord[]> {
    const rows = await prisma.referral.findMany({
      include: { referrer: true, candidate: true, job: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapReferral);
  }

  async listReferralsByReferrer(referrerId: string): Promise<ReferralRecord[]> {
    const rows = await prisma.referral.findMany({
      where: { referrerId },
      include: { referrer: true, candidate: true, job: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapReferral);
  }

  async createReferral(input: ReferralInput, referrerId: string): Promise<ReferralRecord> {
    const email = input.candidateEmail.toLowerCase();
    const candidate = await prisma.candidate.upsert({
      where: { email },
      create: {
        name: input.candidateName,
        email,
        phone: input.candidatePhone,
        resumeUrl: input.resumeUrl,
        linkedinUrl: input.linkedinUrl,
        skills: "[]",
        source: "REFERRAL",
      },
      update: { name: input.candidateName, phone: input.candidatePhone ?? undefined },
    });

    // A referral also enters the candidate into the pipeline.
    const application = await prisma.application.upsert({
      where: { jobId_candidateId: { jobId: input.jobId, candidateId: candidate.id } },
      create: {
        jobId: input.jobId,
        candidateId: candidate.id,
        stage: "APPLIED",
        stageEvents: { create: { toStage: "APPLIED", note: "Entered via employee referral" } },
      },
      update: {},
    });

    // One referral per candidate per role (Referral.applicationId is unique).
    // Without this check a second referral crashes on the constraint instead of
    // telling the submitter what happened.
    const already = await prisma.referral.findUnique({
      where: { applicationId: application.id },
      include: { referrer: true },
    });
    if (already) {
      throw new Error(
        `${input.candidateName} has already been referred for this role` +
          (already.referrer ? ` (by ${already.referrer.name})` : "") +
          `. Only one referral per candidate per role is counted.`,
      );
    }

    const row = await prisma.referral.create({
      data: {
        jobId: input.jobId,
        candidateId: candidate.id,
        referrerId,
        applicationId: application.id,
        relationship: input.relationship,
        comment: input.comment,
        status: "SUBMITTED",
      },
      include: { referrer: true, candidate: true, job: true },
    });
    return mapReferral(row);
  }

  async updateReferralStatus(input: ReferralStatusUpdate): Promise<ReferralRecord> {
    const row = await prisma.referral.update({
      where: { id: input.referralId },
      data: { status: input.status },
      include: { referrer: true, candidate: true, job: true },
    });
    return mapReferral(row);
  }

  // Users -------------------------------------------------------------------

  async listUsers(): Promise<UserRecord[]> {
    const rows = await prisma.user.findMany({ orderBy: { name: "asc" } });
    return rows.map((u) => mapUser(u)!);
  }

  async listUsersByRole(role: Role): Promise<UserRecord[]> {
    const rows = await prisma.user.findMany({ where: { role }, orderBy: { name: "asc" } });
    return rows.map((u) => mapUser(u)!);
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    return mapUser(await prisma.user.findUnique({ where: { id } }));
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    return mapUser(await prisma.user.findUnique({ where: { email: email.toLowerCase() } }));
  }

  async createUser(input: {
    name: string;
    email: string;
    role: Role;
    passwordHash?: string | null;
  }): Promise<UserRecord> {
    const row = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        role: input.role,
        passwordHash: input.passwordHash ?? null,
      },
    });
    return mapUser(row)!;
  }

  async verifyCredentials(email: string, password: string): Promise<UserRecord | null> {
    const row = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!row || !verifyPassword(password, row.passwordHash)) return null;
    return mapUser(row);
  }

  async upsertUser(input: UserInput): Promise<UserRecord> {
    const email = input.email.toLowerCase();
    const row = await prisma.user.upsert({
      where: { email },
      create: { email, name: input.name, role: input.role, title: input.title, department: input.department },
      update: { name: input.name, role: input.role, title: input.title, department: input.department },
    });
    return mapUser(row)!;
  }

  // Dashboard ---------------------------------------------------------------

  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [openPositions, totalApplications, hiredThisMonth, activeReferrals, totalReferrals, hiredReferrals, grouped, apps] =
      await Promise.all([
        prisma.job.count({ where: { status: "PUBLISHED" } }),
        prisma.application.count(),
        prisma.stageEvent.count({ where: { toStage: "HIRED", createdAt: { gte: monthStart } } }),
        prisma.referral.count({ where: { status: { notIn: ["HIRED", "REJECTED"] } } }),
        prisma.referral.count(),
        prisma.referral.count({ where: { status: "HIRED" } }),
        prisma.application.groupBy({ by: ["stage"], _count: { _all: true } }),
        prisma.application.findMany({
          select: { stage: true, stageEvents: { select: { toStage: true } } },
        }),
      ]);

    const stageCounts = grouped.map((g) => ({
      stage: g.stage as DashboardStats["stageCounts"][number]["stage"],
      count: g._count._all,
    }));

    // Funnel: an application "reached" a stage if its current stage or any
    // historical stage event sits at or beyond that point on the happy path.
    const funnel = FUNNEL_STAGES.map((stage) => {
      const target = rankOf(stage);
      const count = apps.filter((a) => {
        const reached = Math.max(
          rankOf(a.stage),
          ...a.stageEvents.map((e) => rankOf(e.toStage)),
        );
        return reached >= target;
      }).length;
      return { stage, label: STAGE_META[stage].label, count };
    });

    return {
      openPositions,
      totalApplications,
      hiredThisMonth,
      activeReferrals,
      stageCounts,
      funnel,
      referralConversionRate: totalReferrals === 0 ? 0 : hiredReferrals / totalReferrals,
    };
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const [apps, referrals, sourceGroups, openPositions, candidates] = await Promise.all([
      prisma.application.findMany({
        select: {
          stage: true,
          job: { select: { department: true } },
          stageEvents: { select: { toStage: true, createdAt: true } },
        },
      }),
      prisma.referral.findMany({ select: { status: true, referrer: { select: { name: true } } } }),
      prisma.candidate.groupBy({ by: ["source"], _count: { _all: true } }),
      prisma.job.count({ where: { status: "PUBLISHED" } }),
      prisma.candidate.count(),
    ]);

    const reached = (a: (typeof apps)[number]) =>
      Math.max(rankOf(a.stage), ...a.stageEvents.map((e) => rankOf(e.toStage)));

    const funnel = FUNNEL_STAGES.map((stage) => ({
      stage,
      label: STAGE_META[stage].label,
      count: apps.filter((a) => reached(a) >= rankOf(stage)).length,
    }));

    const stageCounts = PIPELINE_STAGES.map((stage) => ({
      stage,
      label: STAGE_META[stage].label,
      count: apps.filter((a) => a.stage === stage).length,
    })).filter((s) => s.count > 0);

    const sourceBreakdown = sourceGroups
      .map((g) => ({
        source: g.source,
        label: CANDIDATE_SOURCE_LABELS[g.source as keyof typeof CANDIDATE_SOURCE_LABELS] ?? g.source,
        count: g._count._all,
      }))
      .sort((a, b) => b.count - a.count);

    const deptMap = new Map<string, number>();
    for (const a of apps) {
      const d = a.job?.department ?? "Other";
      deptMap.set(d, (deptMap.get(d) ?? 0) + 1);
    }
    const byDepartment = [...deptMap.entries()]
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    const refMap = new Map<string, { total: number; hired: number }>();
    for (const r of referrals) {
      const name = r.referrer?.name ?? "Unknown";
      const e = refMap.get(name) ?? { total: 0, hired: 0 };
      e.total += 1;
      if (r.status === "HIRED") e.hired += 1;
      refMap.set(name, e);
    }
    const topReferrers = [...refMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.hired - a.hired || b.total - a.total)
      .slice(0, 5);

    // Average time-to-hire: first stage event → the HIRED event, in days.
    const durations: number[] = [];
    for (const a of apps) {
      const hired = a.stageEvents.find((e) => e.toStage === "HIRED");
      if (!hired) continue;
      const first = [...a.stageEvents].sort(
        (x, y) => x.createdAt.getTime() - y.createdAt.getTime(),
      )[0];
      if (!first) continue;
      const days = (hired.createdAt.getTime() - first.createdAt.getTime()) / 86_400_000;
      if (days >= 0) durations.push(days);
    }
    const avgTimeToHireDays = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

    const totalRef = referrals.length;
    const hiredRef = referrals.filter((r) => r.status === "HIRED").length;

    return {
      totals: {
        applications: apps.length,
        hired: apps.filter((a) => a.stage === "HIRED").length,
        openPositions,
        candidates,
      },
      funnel,
      stageCounts,
      sourceBreakdown,
      byDepartment,
      topReferrers,
      avgTimeToHireDays,
      referralConversionRate: totalRef === 0 ? 0 : hiredRef / totalRef,
    };
  }
}

type FeedbackRecommendation = ApplicationDetail["feedback"][number]["recommendation"];
