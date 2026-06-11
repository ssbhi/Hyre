# New-session starting prompt

Open a new Claude Code session **in the `hyre/` folder** and paste the block
below. (Everything between the lines.)

---

I'm continuing work on **Hyre**, an ATS + employee-referral web app. This is an
existing, working codebase — not a new build.

**Before doing anything, read these files in the project root, in order:**
1. `context.md` — full project overview, tech stack, architecture, current status, key decisions, known issues, and how to run.
2. `schema.md` — the data model (Prisma/SQLite) and relationships.
3. `AGENTS.md` / `CLAUDE.md` — this is **Next.js 16 + React 19 + Tailwind v4 + Base UI (not Radix)**; conventions differ from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing framework code.

**Key things to internalize:**
- All data access goes through `repo` from `@/lib/data` (the `HyreRepository` interface) — never import Prisma directly in features.
- Validation uses the Zod schemas in `lib/schemas`. Enums/labels live in `lib/schemas/enums.ts`.
- Auth is custom (scrypt + signed cookie) in `lib/auth`. Staff log in; candidates self-register at apply time. The `(app)` route group is staff-only.
- Server mutations are server actions in `lib/actions/*`.
- Demo logins: `shobhit.soni@hyre.dev` / `hyre1234` (HR Admin). All seeded users use `hyre1234`.

**How I want you to work** (per `context.md` §8):
- Plan briefly, build **one slice at a time**, then **verify** (run `npm run typecheck` and start the dev server to confirm it works) before checking in with me.
- Don't overbuild; only touch the area in scope; preserve existing functionality.

**First, do this:**
1. Run `npm install` (if needed) and `npm run dev`, confirm it builds and serves at http://localhost:3000, and tell me it's up.
2. Give me a 3–4 line summary of current status (from `context.md`) and the list of remaining work.

**Where we're continuing from / what's next (highest priority first):**
1. **Admin/HR pages redesign** — I'm going to share screenshots of the design I want for the staff-facing pages (dashboard, jobs, candidates, etc.). **Wait for my screenshots**, then rework the `app/(app)/*` pages to match. Don't redesign before I send them.
2. **Slice 8 — Polish**: loading/empty/error states, responsive + accessibility passes, motion refinements.
3. **Deployment**: switch SQLite → hosted Postgres + a cloud blob storage adapter, set `AUTH_SECRET`, and deploy (so it's publicly accessible). See `context.md` §6.
4. **Phase 2 — AI**: wire `lib/ai` to Claude (resume insights, JD generator, smarter assistant).

Start with step 1 (get it running + summarize), then ask me for the admin
screenshots before changing any UI.

---
