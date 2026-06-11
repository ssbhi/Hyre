# Hyre — Project Context & Handoff

> Handoff doc for continuing in a new Claude Code session. Read this first, then
> `schema.md`, then follow `prompt.md`.

---

## 1. Project overview

**Hyre** is a modern **Applicant Tracking System (ATS) + Employee Referral platform**, built for an internal AI Hackathon at an HR-tech-adjacent org.

**The problem it solves:** today, when someone clicks "Careers" on the company
website, they're redirected to the company's LinkedIn jobs page. Hyre replaces
that with an **in-house careers portal + full ATS**, so applications live in the
company's own system instead of a third party.

**Users & what they do:**
- **External candidates** (public, no login to browse): browse/search/filter open
  roles on `/careers`, and **apply to one or more roles at once**. Login/sign-up
  is required **only at the moment they click Apply** (candidate self-service
  accounts).
- **HR Admins** (staff login): dashboard, create/manage jobs, move candidates
  through the pipeline (kanban), notes + interview feedback, search, referrals,
  analytics, and an AI assistant ("Ask Hyre").
- **Employees** (staff login): submit referrals and track their own referrals.

**Product name:** Hyre (chosen with the user). Tagline: "Hire & refer, in one flow."

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) |
| UI runtime | **React 19** + TypeScript |
| Styling | **Tailwind CSS v4** (CSS-based config, oklch tokens) |
| Components | **shadcn/ui** — newest "base-nova" style built on **Base UI** (NOT Radix) |
| Animation | **motion** (`motion/react`) |
| Theming | **next-themes** (light/dark) |
| DB / ORM | **Prisma 6 + SQLite** (`prisma/dev.db`) |
| Validation | **Zod 4** |
| Auth | Custom: **scrypt** password hashing + **HMAC-signed httpOnly cookie** |
| File storage | Local-disk adapter (`public/uploads`) behind a `lib/storage` abstraction |
| Icons | `lucide-react` v1 (note: brand icons like `Linkedin` were removed in v1) |

> ⚠️ **Base UI ≠ Radix.** Components use a `render` prop for composition (not
> `asChild`), and `Sheet`/dialogs are controlled via `open`/`onOpenChange`.

---

## 3. Architecture (the important part)

Everything is built around a **storage abstraction** so the database can be
swapped without touching feature code:

- **`lib/data/repository.ts`** — `HyreRepository` interface (the contract every
  feature uses via `import { repo } from "@/lib/data"`).
- **`lib/data/adapters/prisma-repository.ts`** — the active implementation.
- **`lib/data/adapters/sheets-repository.ts`** — a typed **stub** that proves the
  seam (selected via `DATA_SOURCE=sheets`); methods currently throw "not
  implemented".
- **`lib/data/types.ts`** — plain JSON-serialisable domain records returned by the
  repo (decoupled from Prisma types).
- **`lib/data/index.ts`** — factory: picks the adapter from `DATA_SOURCE` env
  (default `prisma`).

Other key modules:
- **`lib/schemas/`** — `enums.ts` (canonical enums + labels + tones) and
  `index.ts` (Zod input schemas, shared client + server).
- **`lib/auth/`** — `password.ts` (scrypt), `session.ts` (signed cookie +
  `getCurrentUser`/`getSessionUser`), `actions.ts` (`login`/`logout`/`signup`).
- **`lib/actions/`** — server actions: `jobs.ts`, `pipeline.ts`,
  `applications.ts`, `referrals.ts`.
- **`lib/ai/`** — provider-agnostic AI interface (`index.ts`) + a deterministic
  intent engine (`assistant.ts`) + `actions.ts`. Works today with no API key;
  upgrades to Claude later via `ai.enabled`.
- **`lib/storage/index.ts`** — `FileStorage` interface + `LocalStorage` adapter.

**Route groups:**
- `app/(app)/...` — the **staff workspace** (top-nav ribbon shell). Guarded:
  `getCurrentUser()` redirects to `/login`; candidates are redirected to `/careers`.
  Pages: `dashboard`, `jobs`, `jobs/new`, `jobs/[id]`, `jobs/[id]/edit`,
  `candidates` (kanban), `candidates/[id]` (profile), `search`, `referrals`,
  `referrals/new`, `analytics`.
- `app/careers/...` — **public** candidate portal (own layout): browse `/careers`,
  detail `/careers/[slug]`, gated apply `/careers/apply`.
- `app/login` — staff + candidate sign-in.
- `app/page.tsx` — marketing landing page.

---

## 4. Current status

### ✅ Done (Phase 1, Slices 0–7)
- **0 Foundation** — scaffold, design system/brand (indigo on shadcn neutral),
  data layer, Zod schemas, Prisma schema, seed, landing page.
- **1 HR workspace** — top-nav ribbon, dashboard (stat tiles, hiring funnel,
  recent jobs, "needs attention" with quick Shortlist/Reject), **Ask Hyre AI**
  assistant (works on real data, no API key).
- **2 Job management** — list (filters + search), create/edit form, detail,
  publish/unpublish/duplicate/archive (HR-only).
- **3 Career portal + apply** — public browse/search/filter + application +
  resume upload (later reshaped, see Slice "Careers reshape" below).
- **4 ATS pipeline** — `/candidates` kanban (8 active-stage columns, native HTML5
  drag-drop + optimistic + per-card move menu); profile page with stage changer,
  notes, interview feedback, timeline, recruiter assignment.
- **5 Candidate search** — `/search`: text (name/email/skill), job/stage/recruiter
  filters, results table.
- **6 Referrals** — `/referrals` role-aware (HR sees all + status select + conversion
  stats; employees see their own), `/referrals/new` refer form w/ resume.
- **7 Analytics** — `/analytics`: funnel, source-of-candidates, applications-by-
  department, stage distribution, top referrers, avg time-to-hire, conversion.
- **Real authentication** (added after Slice 6) — email+password login, scrypt +
  signed cookie, `/login`, sign-out. Staff seeded; candidates self-sign-up.
- **Careers reshape** (latest) — `/careers` fully public (no login to browse);
  **multi-select apply** (tick roles → "Apply to N"); login/sign-up required ONLY
  at apply (`/careers/apply` gates via `CandidateAuth` → then `MultiApplyForm`);
  candidates blocked from the staff workspace.

### 🔜 Pending
- **Slice 8 — Polish**: loading/empty states, responsive passes, a11y sweep,
  motion refinements, error boundaries.
- **Admin/HR pages redesign**: the user will share screenshots; rework the staff
  pages (dashboard/jobs/etc.) to match that design. **Do this with their screenshots.**
- **Deployment**: switch SQLite → hosted Postgres + cloud blob storage, deploy
  (see §6).
- **Phase 2 — AI**: wire `lib/ai` to Claude (resume insights, JD generator, smarter
  assistant). Architecture is ready; nothing wired yet.

---

## 5. Key decisions (and why)

1. **Repository abstraction over the DB** — so Google Sheets / Postgres can be
   dropped in later without rewriting features. This was a core requirement.
2. **Prisma 6, not 7** — Prisma 7 forces native driver adapters (fragile on
   Windows); v6's classic `url = env(...)` workflow is rock-solid. Revisit at deploy.
3. **SQLite for dev/demo** — reliable, offline, fast for the hackathon demo. The
   Google Sheets adapter ships as a stub to satisfy the "Sheets-ready" requirement.
4. **Custom auth (scrypt + HMAC cookie), not Auth.js** — avoids Auth.js beta
   friction with Next 16 / React 19, and uses only Node built-ins (deploy-safe,
   no native modules). Google OAuth is a clean later drop-in in `lib/auth`.
5. **AI assistant = deterministic engine now** — answers real pipeline questions
   without an API key, behind the same interface a Claude provider will use. Demo
   works offline; upgrade is a config change.
6. **Native HTML5 drag-and-drop for the kanban** — no DnD library dependency;
   reliable on desktop. Every card also has a "Move to" menu as a fallback.
7. **Candidate identity comes from the session, not the apply form** — applications
   always tie back to the logged-in candidate's account (can't apply as someone else).
8. **Enums stored as strings + Zod-validated** — SQLite has no enums; this also
   makes the Postgres migration clean (string columns → real PG enums later).

---

## 6. Known issues / gotchas

- **SQLite + local file storage do NOT work on serverless** (Vercel/Netlify =
  read-only, ephemeral FS). For deploy: switch Prisma datasource to **Postgres**
  (Neon / Vercel Postgres / Supabase), run `prisma migrate`, and add a **blob**
  storage adapter (Vercel Blob / S3) in `lib/storage`. Both are one-adapter swaps.
- **`AUTH_SECRET`** has a dev fallback in `lib/auth/session.ts`. **Set a strong
  value in production** (`.env`).
- **`npm run db:reset` is blocked for AI** — Prisma's `--force-reset` requires
  explicit human consent. To reset data, run `db:reset` yourself in a terminal,
  or use a targeted `prisma` delete script.
- **Base UI dropdowns/menus don't open via synthetic `.click()`** in the preview
  test harness — verify menus with real human clicks. (Not a product bug.)
- **lucide-react v1 dropped brand icons** (`Linkedin`, `Github`, …). Use generic
  icons (we use `Link2` for LinkedIn).
- **No staff self-signup** — staff accounts are seeded; only candidates self-register.
  Tell Claude if you want a staff "create account" / invite flow.
- Resume files currently save to `public/uploads/` (gitignored-ish; fine locally).

---

## 7. How to run

```powershell
cd "C:\Users\shobhit.soni.ap\Desktop\new new\hyre"
npm install        # if node_modules is missing
npm run dev        # http://localhost:3000
```

Useful scripts: `npm run typecheck`, `npm run db:push`, `npm run db:seed`,
`npm run db:studio`, `npm run db:reset` (run manually — see §6).

**Demo logins** (all seeded users share password **`hyre1234`**):
- HR Admin (primary): **`shobhit.soni@hyre.dev`** / `hyre1234`
- Employee (for referral view): `dev.rao@hyre.dev` / `hyre1234`
- Candidates self-register at `/careers/apply`.

**Seed data:** 9 users, 7 jobs (5 published / 1 draft / 1 archived), 12 candidates,
12 applications (spread across stages with histories), 4 referrals.

---

## 8. Next steps (recommended order)

1. **Admin redesign** — get the user's screenshots, rework `app/(app)/*` pages to match.
2. **Slice 8 polish** — loading/empty/error states, responsive + a11y sweep.
3. **Deploy** — Postgres + blob storage + Vercel; set `AUTH_SECRET`, `DATABASE_URL`.
4. **Phase 2 AI** — wire `lib/ai` to Claude.

> Working style the user expects: **plan briefly, build one slice at a time, verify
> (typecheck + run the dev server), then check in.** Don't overbuild. Only touch the
> area in scope. The repo abstraction and Zod schemas are the backbone — keep using them.
