// Deletes the seeded demo candidates (backdated rows) from the live DB.
// Cascades remove their applications, stage events, notes, feedback, and the
// seeded referrals. Real rows (created after the cutoff) are untouched.
//   docker exec -i app-web-1 node - < scripts/clean-live-data.js
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
const CUTOFF = new Date("2026-06-12T08:30:00Z");

(async () => {
  const del = await p.candidate.deleteMany({ where: { createdAt: { lt: CUTOFF } } });
  console.log("deleted seeded candidates:", del.count);
  console.log("remaining:", {
    candidates: await p.candidate.count(),
    applications: await p.application.count(),
    referrals: await p.referral.count(),
  });
  const refs = await p.referral.findMany({ include: { candidate: true, referrer: true } });
  refs.forEach((r) => console.log("  referral:", r.candidate.name, "by", r.referrer.name, "—", r.status));
  const apps = await p.application.findMany({ include: { candidate: true, job: true } });
  apps.forEach((a) => console.log("  application:", a.candidate.name, "→", a.job.title, "—", a.stage));
  process.exit(0);
})();
