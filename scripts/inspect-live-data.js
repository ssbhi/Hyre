// Classifies live data: seeded/demo rows (backdated by the seed script) vs
// real rows created by actual users. Run inside the app container:
//   docker exec -i app-web-1 node - < scripts/inspect-live-data.js
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
const CUTOFF = new Date("2026-06-12T08:30:00Z"); // box was deployed ~08:00Z; real traffic started 09:42Z

(async () => {
  const seededCandidates = await p.candidate.findMany({
    where: { createdAt: { lt: CUTOFF } },
    select: { name: true },
  });
  const realCandidates = await p.candidate.findMany({
    where: { createdAt: { gte: CUTOFF } },
    select: { name: true, email: true, source: true, createdAt: true },
  });
  console.log("SEEDED candidates (to delete):", seededCandidates.length);
  console.log("  " + seededCandidates.map((c) => c.name).join(", "));
  console.log("REAL candidates (to keep):", realCandidates.length);
  realCandidates.forEach((c) =>
    console.log("  " + c.createdAt.toISOString() + "  " + c.name + "  <" + c.email + ">  " + c.source),
  );
  console.log("totals:", {
    applications: await p.application.count(),
    referrals: await p.referral.count(),
    users: await p.user.count(),
  });
  process.exit(0);
})();
