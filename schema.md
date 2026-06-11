# Hyre — Data Model & Schema

> **Important:** Hyre's live database is **Prisma + SQLite** (`prisma/schema.prisma`),
> not Google Sheets. A Google Sheets adapter exists only as a typed stub
> (`lib/data/adapters/sheets-repository.ts`). This file documents (A) the real
> Prisma data model, and (B) the equivalent Google Sheets layout to implement if
> you ever switch `DATA_SOURCE=sheets`.

---

## A. Prisma data model (source of truth)

Enums are stored as **strings** (SQLite has no enum type) and validated by Zod.
List-like fields (`skills`, `requiredSkills`) are stored as **JSON-string arrays**.
All timestamps are `DateTime`; the repo serialises them to ISO strings.

### `User` — staff and candidate accounts
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| email | String | **unique** |
| name | String | |
| role | String | `HR_ADMIN` \| `EMPLOYEE` \| `CANDIDATE` |
| passwordHash | String? | scrypt `salt:hash`; null = can't log in |
| title | String? | job title |
| department | String? | |
| avatarUrl | String? | |
| createdAt / updatedAt | DateTime | |

Relations: hiring-manager-of `Job[]`, recruiter-of `Job[]`, recruiter-of
`Application[]`, `Referral[]` (as referrer), `Note[]`, `StageEvent[]`,
`InterviewFeedback[]`.

### `Job`
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| title | String | |
| slug | String | **unique** (used in `/careers/[slug]`) |
| department | String | |
| employmentType | String | `FULL_TIME` \| `PART_TIME` \| `CONTRACT` \| `INTERNSHIP` \| `TEMPORARY` |
| location | String | e.g. "Bengaluru, IN" |
| locationType | String | `ONSITE` \| `REMOTE` \| `HYBRID` |
| description | String | long text |
| requiredSkills | String | **JSON array** of strings |
| openings | Int | default 1 |
| status | String | `DRAFT` \| `PUBLISHED` \| `ARCHIVED` |
| postedAt | DateTime? | stamped on first publish |
| hiringManagerId | String? | FK → User |
| recruiterId | String? | FK → User |
| createdAt / updatedAt | DateTime | |

Indexes: `status`, `department`. Relations: `Application[]`, `Referral[]`.

### `Candidate` — applicant profile (distinct from a candidate's login `User`)
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | |
| email | String | **unique** (the join key for applications) |
| phone | String? | |
| location | String? | |
| currentEmployer | String? | |
| currentTitle | String? | |
| totalExperienceYears | Float? | |
| noticePeriodDays | Int? | |
| currentCtc | String? | free text (e.g. "₹25 LPA") |
| expectedCtc | String? | |
| linkedinUrl | String? | |
| portfolioUrl | String? | |
| resumeUrl | String? | path/URL from storage adapter |
| skills | String | **JSON array** |
| source | String | `CAREER_PORTAL` \| `REFERRAL` \| `MANUAL` |
| createdAt / updatedAt | DateTime | |

Relations: `Application[]`, `Referral[]`.

### `Application` — a candidate's progress on one job (the ATS pipeline unit)
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| stage | String | pipeline stage (see enum below); default `APPLIED` |
| coverNote | String? | |
| rejectedReason | String? | |
| jobId | String | FK → Job (cascade delete) |
| candidateId | String | FK → Candidate (cascade delete) |
| recruiterId | String? | FK → User |
| createdAt / updatedAt | DateTime | |

Constraints: **unique [jobId, candidateId]** (one application per candidate per
job). Index: `stage`. Relations: `Note[]`, `StageEvent[]`, `InterviewFeedback[]`,
optional `Referral`.

### `Referral`
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| status | String | `SUBMITTED` \| `UNDER_REVIEW` \| `SHORTLISTED` \| `INTERVIEWING` \| `HIRED` \| `REJECTED` |
| relationship | String? | how referrer knows candidate |
| comment | String? | |
| jobId | String | FK → Job |
| candidateId | String | FK → Candidate |
| referrerId | String | FK → User (the employee) |
| applicationId | String? | **unique**, FK → Application (the referral's pipeline entry) |
| createdAt / updatedAt | DateTime | |

Index: `status`. A referral also creates/links an `Application` so it enters the
pipeline and is countable for conversion.

### `Note` — recruiter notes on an application
| id (PK) | body | createdAt | applicationId (FK, cascade) | authorId? (FK→User) |

### `StageEvent` — pipeline history (drives timeline + funnel)
| id (PK) | fromStage? | toStage | note? | createdAt | applicationId (FK, cascade) | changedById? (FK→User) |

### `InterviewFeedback`
| id (PK) | round? | rating? (Int 1–5) | recommendation? (`STRONG_YES`\|`YES`\|`NO`\|`STRONG_NO`) | strengths? | concerns? | comments? | createdAt | applicationId (FK, cascade) | interviewerId? (FK→User) |

### Pipeline stages (enum, ordered)
`APPLIED → SCREENING → SHORTLISTED → INTERVIEW_SCHEDULED → INTERVIEW_COMPLETED →
OFFER_EXTENDED → OFFER_ACCEPTED → HIRED`, plus terminal `REJECTED` and `ON_HOLD`.
The kanban shows the 8 non-terminal stages as columns. Defined in
`lib/schemas/enums.ts` (`PIPELINE_STAGES`, `STAGE_META`, `FUNNEL_STAGES`).

---

## B. Relationships (summary)

```
User 1───* Job        (hiringManager, recruiter)
User 1───* Application (recruiter)
User 1───* Referral    (referrer)
Job  1───* Application
Job  1───* Referral
Candidate 1───* Application
Candidate 1───* Referral
Application 1───* Note / StageEvent / InterviewFeedback
Application 1───0..1 Referral
```

`Candidate.email` is the natural key linking a logged-in candidate `User` to their
`Candidate` profile and applications (apply flow upserts Candidate by email).

---

## C. Google Sheets layout (only if implementing the Sheets adapter)

If `DATA_SOURCE=sheets`, implement `SheetsRepository` with **one tab per entity**,
columns mirroring the Prisma fields above. Suggested workbook:

| Tab | Columns (header row) |
|---|---|
| **Users** | id, email, name, role, passwordHash, title, department, avatarUrl, createdAt, updatedAt |
| **Jobs** | id, title, slug, department, employmentType, location, locationType, description, requiredSkills (JSON), openings, status, postedAt, hiringManagerId, recruiterId, createdAt, updatedAt |
| **Candidates** | id, name, email, phone, location, currentEmployer, currentTitle, totalExperienceYears, noticePeriodDays, currentCtc, expectedCtc, linkedinUrl, portfolioUrl, resumeUrl, skills (JSON), source, createdAt, updatedAt |
| **Applications** | id, jobId, candidateId, recruiterId, stage, coverNote, rejectedReason, createdAt, updatedAt |
| **Referrals** | id, jobId, candidateId, referrerId, applicationId, status, relationship, comment, createdAt, updatedAt |
| **Notes** | id, applicationId, authorId, body, createdAt |
| **StageEvents** | id, applicationId, changedById, fromStage, toStage, note, createdAt |
| **InterviewFeedback** | id, applicationId, interviewerId, round, rating, recommendation, strengths, concerns, comments, createdAt |

Implementation notes for the Sheets adapter:
- Auth via a **Google service account** (`googleapis`) shared on the sheet.
- Generate `id`s client-side (cuid) since there's no DB autoincrement.
- Store `skills`/`requiredSkills` as JSON strings in a single cell (same as SQLite).
- "Foreign keys" are just id strings; resolve relations by in-memory lookups.
- **Cache reads briefly** — Sheets API latency is the main risk; don't depend on it
  for a live demo (this is why SQLite is the default).

---

## D. Sample data (seed: `prisma/seed.ts`)

- **Users (9):** Shobhit Soni & Priya Nair & Arjun Mehta & Sara Khan (HR_ADMIN);
  Dev Rao, Meera Iyer, Rahul Gupta, Nisha Verma, Tom Fernandes (EMPLOYEE). All
  password `hyre1234`.
- **Jobs (7):** Senior Frontend Engineer, Backend Engineer (Platform), Product
  Designer, Product Manager, Account Executive (PUBLISHED); Developer Advocate
  (DRAFT); Data Scientist (ARCHIVED).
- **Candidates (12):** spread across roles with realistic skills/CTC/notice.
- **Applications (12):** distributed across pipeline stages, each with a
  `StageEvent` history (so the funnel + timelines look real). Two have notes +
  interview feedback.
- **Referrals (4):** by Dev Rao / Rahul Gupta / Tom Fernandes; one HIRED (→ 25%
  conversion in the seed).
