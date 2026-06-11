/**
 * Seed data for True Balance.
 *
 * Run with `npm run db:seed`. Idempotent: it clears the relevant tables first,
 * then rebuilds a realistic recruiting picture — users, jobs across departments
 * and statuses, candidates, applications spread across pipeline stages (each
 * with a stage-event history so the funnel + timelines look real), referrals,
 * notes, and interview feedback.
 */
import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

// Every seeded user shares this password for easy demo logins.
const DEMO_PASSWORD = "hyre1234";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * DAY);

async function main() {
  // Clear in FK-safe order.
  await prisma.interviewFeedback.deleteMany();
  await prisma.stageEvent.deleteMany();
  await prisma.note.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.application.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  // --- Users -------------------------------------------------------------
  const usersData = [
    { key: "shobhit", email: "shobhit.soni@hyre.dev", name: "Shobhit Soni", role: "HR_ADMIN", title: "Head of Talent", department: "People" },
    { key: "priya", email: "priya.nair@hyre.dev", name: "Priya Nair", role: "HR_ADMIN", title: "Talent Partner", department: "People" },
    { key: "arjun", email: "arjun.mehta@hyre.dev", name: "Arjun Mehta", role: "HR_ADMIN", title: "Senior Recruiter", department: "People" },
    { key: "sara", email: "sara.khan@hyre.dev", name: "Sara Khan", role: "HR_ADMIN", title: "Recruiter", department: "People" },
    { key: "dev", email: "dev.rao@hyre.dev", name: "Dev Rao", role: "EMPLOYEE", title: "Staff Engineer", department: "Engineering" },
    { key: "meera", email: "meera.iyer@hyre.dev", name: "Meera Iyer", role: "EMPLOYEE", title: "Engineering Manager", department: "Engineering" },
    { key: "rahul", email: "rahul.gupta@hyre.dev", name: "Rahul Gupta", role: "EMPLOYEE", title: "Design Lead", department: "Design" },
    { key: "nisha", email: "nisha.verma@hyre.dev", name: "Nisha Verma", role: "EMPLOYEE", title: "Product Manager", department: "Product" },
    { key: "tom", email: "tom.fernandes@hyre.dev", name: "Tom Fernandes", role: "EMPLOYEE", title: "Account Executive", department: "Sales" },
  ] as const;

  const users: Record<string, string> = {};
  for (const u of usersData) {
    const created = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        role: u.role,
        title: u.title,
        department: u.department,
        passwordHash: hashPassword(DEMO_PASSWORD),
      },
    });
    users[u.key] = created.id;
  }

  // --- Jobs --------------------------------------------------------------
  const jobsData = [
    {
      key: "fe", title: "Senior Frontend Engineer", department: "Engineering",
      employmentType: "FULL_TIME", location: "Bengaluru, IN", locationType: "HYBRID",
      status: "PUBLISHED", openings: 2, postedDaysAgo: 24, hm: "meera", rec: "arjun",
      skills: ["React", "TypeScript", "Next.js", "CSS", "Accessibility"],
      description:
        "We're looking for a Senior Frontend Engineer to craft delightful, performant interfaces. You'll own features end-to-end, mentor engineers, and partner closely with design and product.\n\nWhat you'll do:\n- Build and ship user-facing features in React/Next.js\n- Set the bar for performance, accessibility, and code quality\n- Mentor and review across the frontend team",
    },
    {
      key: "be", title: "Backend Engineer (Platform)", department: "Engineering",
      employmentType: "FULL_TIME", location: "Remote, IN", locationType: "REMOTE",
      status: "PUBLISHED", openings: 1, postedDaysAgo: 18, hm: "meera", rec: "sara",
      skills: ["Node.js", "PostgreSQL", "AWS", "Distributed Systems"],
      description:
        "Join our platform team to build the services that power True Balance. You'll design APIs, own reliability, and scale our data layer.\n\nWhat you'll do:\n- Design and build backend services and APIs\n- Improve reliability, observability, and performance\n- Collaborate on data modelling and migrations",
    },
    {
      key: "designer", title: "Product Designer", department: "Design",
      employmentType: "FULL_TIME", location: "Bengaluru, IN", locationType: "ONSITE",
      status: "PUBLISHED", openings: 1, postedDaysAgo: 12, hm: "rahul", rec: "arjun",
      skills: ["Figma", "Interaction Design", "Prototyping", "Design Systems"],
      description:
        "Shape the end-to-end experience of True Balance. You'll run discovery, design flows, and partner with engineering to ship.\n\nWhat you'll do:\n- Own design for a product area from research to delivery\n- Contribute to and extend our design system\n- Prototype and validate with users",
    },
    {
      key: "pm", title: "Product Manager", department: "Product",
      employmentType: "FULL_TIME", location: "Mumbai, IN", locationType: "HYBRID",
      status: "PUBLISHED", openings: 1, postedDaysAgo: 9, hm: "nisha", rec: "sara",
      skills: ["Roadmapping", "Discovery", "Analytics", "Stakeholder Management"],
      description:
        "Drive the strategy and execution for a core True Balance product area. You'll define the roadmap, run discovery, and ship outcomes.\n\nWhat you'll do:\n- Own a product area's roadmap and metrics\n- Run discovery and translate insight into shipped value\n- Align engineering, design, and go-to-market",
    },
    {
      key: "ae", title: "Account Executive", department: "Sales",
      employmentType: "FULL_TIME", location: "Delhi, IN", locationType: "ONSITE",
      status: "PUBLISHED", openings: 3, postedDaysAgo: 6, hm: "tom", rec: "arjun",
      skills: ["B2B Sales", "Pipeline Management", "Negotiation"],
      description:
        "Own the full sales cycle for mid-market accounts. You'll prospect, run demos, and close.\n\nWhat you'll do:\n- Build and manage a healthy pipeline\n- Run discovery and product demos\n- Close and expand accounts",
    },
    {
      key: "devrel", title: "Developer Advocate", department: "Marketing",
      employmentType: "CONTRACT", location: "Remote", locationType: "REMOTE",
      status: "DRAFT", openings: 1, postedDaysAgo: null, hm: "nisha", rec: "sara",
      skills: ["Public Speaking", "Technical Writing", "Community"],
      description:
        "Grow and nurture our developer community through content, talks, and sample apps.\n\nWhat you'll do:\n- Create technical content and demos\n- Represent True Balance at events and online\n- Channel community feedback to product",
    },
    {
      key: "datasci", title: "Data Scientist", department: "Engineering",
      employmentType: "FULL_TIME", location: "Bengaluru, IN", locationType: "HYBRID",
      status: "ARCHIVED", openings: 1, postedDaysAgo: 60, hm: "meera", rec: "arjun",
      skills: ["Python", "ML", "SQL", "Experimentation"],
      description:
        "This role has been filled and archived. Kept for reporting history.\n\nWhat you'll do:\n- Build models and run experiments\n- Partner with product on metrics",
    },
  ] as const;

  const jobs: Record<string, string> = {};
  for (const j of jobsData) {
    const created = await prisma.job.create({
      data: {
        title: j.title,
        slug: j.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        department: j.department,
        employmentType: j.employmentType,
        location: j.location,
        locationType: j.locationType,
        description: j.description,
        requiredSkills: JSON.stringify(j.skills),
        openings: j.openings,
        status: j.status,
        postedAt: j.postedDaysAgo == null ? null : daysAgo(j.postedDaysAgo),
        hiringManagerId: users[j.hm],
        recruiterId: users[j.rec],
        createdAt: daysAgo(j.postedDaysAgo ?? 30),
      },
    });
    jobs[j.key] = created.id;
  }

  // --- Candidates --------------------------------------------------------
  const candidatesData = [
    { key: "c1", name: "Aditi Sharma", email: "aditi.sharma@example.com", title: "Frontend Engineer", employer: "Flipkart", exp: 6, skills: ["React", "TypeScript", "Next.js"], source: "CAREER_PORTAL", expectedCtc: "₹38 LPA", notice: 60 },
    { key: "c2", name: "Karthik Reddy", email: "karthik.reddy@example.com", title: "Senior SDE", employer: "Razorpay", exp: 7, skills: ["React", "TypeScript", "GraphQL"], source: "REFERRAL", expectedCtc: "₹42 LPA", notice: 30 },
    { key: "c3", name: "Fatima Sheikh", email: "fatima.sheikh@example.com", title: "UI Engineer", employer: "Swiggy", exp: 4, skills: ["React", "CSS", "Accessibility"], source: "CAREER_PORTAL", expectedCtc: "₹28 LPA", notice: 45 },
    { key: "c4", name: "Rohan Das", email: "rohan.das@example.com", title: "Backend Engineer", employer: "PhonePe", exp: 5, skills: ["Node.js", "PostgreSQL", "AWS"], source: "CAREER_PORTAL", expectedCtc: "₹35 LPA", notice: 60 },
    { key: "c5", name: "Sneha Pillai", email: "sneha.pillai@example.com", title: "Platform Engineer", employer: "CRED", exp: 6, skills: ["Node.js", "Distributed Systems", "AWS"], source: "REFERRAL", expectedCtc: "₹40 LPA", notice: 90 },
    { key: "c6", name: "Imran Qureshi", email: "imran.qureshi@example.com", title: "Product Designer", employer: "Zomato", exp: 5, skills: ["Figma", "Design Systems", "Prototyping"], source: "CAREER_PORTAL", expectedCtc: "₹30 LPA", notice: 30 },
    { key: "c7", name: "Ananya Bose", email: "ananya.bose@example.com", title: "Senior Designer", employer: "Myntra", exp: 7, skills: ["Figma", "Interaction Design"], source: "REFERRAL", expectedCtc: "₹34 LPA", notice: 60 },
    { key: "c8", name: "Vikram Singh", email: "vikram.singh@example.com", title: "Product Manager", employer: "Paytm", exp: 8, skills: ["Roadmapping", "Analytics"], source: "CAREER_PORTAL", expectedCtc: "₹45 LPA", notice: 90 },
    { key: "c9", name: "Divya Menon", email: "divya.menon@example.com", title: "Associate PM", employer: "Ola", exp: 4, skills: ["Discovery", "Stakeholder Management"], source: "CAREER_PORTAL", expectedCtc: "₹26 LPA", notice: 30 },
    { key: "c10", name: "Sameer Joshi", email: "sameer.joshi@example.com", title: "Account Executive", employer: "Freshworks", exp: 5, skills: ["B2B Sales", "Negotiation"], source: "REFERRAL", expectedCtc: "₹24 LPA", notice: 30 },
    { key: "c11", name: "Pooja Nair", email: "pooja.nair@example.com", title: "Sales Lead", employer: "Zoho", exp: 6, skills: ["Pipeline Management", "B2B Sales"], source: "CAREER_PORTAL", expectedCtc: "₹28 LPA", notice: 45 },
    { key: "c12", name: "Aryan Kapoor", email: "aryan.kapoor@example.com", title: "Frontend Developer", employer: "Meesho", exp: 3, skills: ["React", "JavaScript"], source: "CAREER_PORTAL", expectedCtc: "₹22 LPA", notice: 15 },
  ] as const;

  const candidates: Record<string, string> = {};
  for (const c of candidatesData) {
    const created = await prisma.candidate.create({
      data: {
        name: c.name,
        email: c.email,
        phone: "+91 90000 0000" + Math.floor(Math.random() * 9),
        location: "India",
        currentEmployer: c.employer,
        currentTitle: c.title,
        totalExperienceYears: c.exp,
        noticePeriodDays: c.notice,
        expectedCtc: c.expectedCtc,
        linkedinUrl: `https://linkedin.com/in/${c.key}`,
        skills: JSON.stringify(c.skills),
        source: c.source,
      },
    });
    candidates[c.key] = created.id;
  }

  // --- Applications (with stage-event histories) -------------------------
  // history = ordered happy-path stages the candidate has moved through; the
  // last entry is their current stage. Events are timestamped from appliedDaysAgo.
  const apps: {
    cand: string; job: string; rec?: string; appliedDaysAgo: number; history: string[];
  }[] = [
    { cand: "c1", job: "fe", rec: "arjun", appliedDaysAgo: 22, history: ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "OFFER_EXTENDED"] },
    { cand: "c2", job: "fe", rec: "arjun", appliedDaysAgo: 20, history: ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW_SCHEDULED"] },
    { cand: "c3", job: "fe", rec: "arjun", appliedDaysAgo: 16, history: ["APPLIED", "SCREENING", "SHORTLISTED"] },
    { cand: "c12", job: "fe", rec: "arjun", appliedDaysAgo: 10, history: ["APPLIED", "SCREENING", "REJECTED"] },
    { cand: "c4", job: "be", rec: "sara", appliedDaysAgo: 15, history: ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED"] },
    { cand: "c5", job: "be", rec: "sara", appliedDaysAgo: 14, history: ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "OFFER_EXTENDED", "OFFER_ACCEPTED", "HIRED"] },
    { cand: "c6", job: "designer", rec: "arjun", appliedDaysAgo: 11, history: ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW_SCHEDULED"] },
    { cand: "c7", job: "designer", rec: "arjun", appliedDaysAgo: 9, history: ["APPLIED", "SCREENING"] },
    { cand: "c8", job: "pm", rec: "sara", appliedDaysAgo: 8, history: ["APPLIED", "SCREENING", "SHORTLISTED"] },
    { cand: "c9", job: "pm", rec: "sara", appliedDaysAgo: 5, history: ["APPLIED", "ON_HOLD"] },
    { cand: "c10", job: "ae", rec: "arjun", appliedDaysAgo: 5, history: ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW_SCHEDULED"] },
    { cand: "c11", job: "ae", rec: "arjun", appliedDaysAgo: 3, history: ["APPLIED"] },
  ];

  const appIds: Record<string, string> = {}; // key `${cand}:${job}` -> application id
  for (const a of apps) {
    const stage = a.history[a.history.length - 1];
    const application = await prisma.application.create({
      data: {
        jobId: jobs[a.job],
        candidateId: candidates[a.cand],
        recruiterId: a.rec ? users[a.rec] : null,
        stage,
        createdAt: daysAgo(a.appliedDaysAgo),
        updatedAt: daysAgo(Math.max(0, a.appliedDaysAgo - a.history.length)),
      },
    });
    appIds[`${a.cand}:${a.job}`] = application.id;

    // One stage event per history entry, spaced out over the elapsed time.
    const span = a.appliedDaysAgo;
    for (let i = 0; i < a.history.length; i++) {
      const at = daysAgo(span - Math.round((span * i) / Math.max(1, a.history.length - 1)));
      await prisma.stageEvent.create({
        data: {
          applicationId: application.id,
          fromStage: i === 0 ? null : a.history[i - 1],
          toStage: a.history[i],
          createdAt: at,
          changedById: i === 0 ? null : users[a.rec ?? "arjun"],
          note: i === 0 ? "Application received" : undefined,
        },
      });
    }
  }

  // --- Notes & feedback on a couple of advanced candidates ---------------
  await prisma.note.create({
    data: {
      applicationId: appIds["c1:fe"],
      authorId: users["arjun"],
      body: "Strong portfolio, excellent communication. Moving to offer — looping in Meera on comp.",
      createdAt: daysAgo(4),
    },
  });
  await prisma.interviewFeedback.create({
    data: {
      applicationId: appIds["c1:fe"],
      interviewerId: users["meera"],
      round: "Technical Round 2",
      rating: 5,
      recommendation: "STRONG_YES",
      strengths: "Deep React/TS knowledge, great system thinking, mentors well.",
      concerns: "Slightly light on accessibility specifics.",
      comments: "Would be a strong addition to the frontend team.",
      createdAt: daysAgo(6),
    },
  });
  await prisma.interviewFeedback.create({
    data: {
      applicationId: appIds["c5:be"],
      interviewerId: users["meera"],
      round: "System Design",
      rating: 5,
      recommendation: "STRONG_YES",
      strengths: "Excellent distributed systems fundamentals.",
      comments: "Hired — accepted offer.",
      createdAt: daysAgo(7),
    },
  });

  // --- Referrals (linked to existing applications where present) ---------
  const referralsData = [
    { cand: "c2", job: "fe", referrer: "dev", status: "INTERVIEWING", relationship: "Former colleague at Razorpay", comment: "Worked with Karthik for 3 years — exceptional engineer." },
    { cand: "c5", job: "be", referrer: "dev", status: "HIRED", relationship: "Ex-teammate", comment: "Best platform engineer I know." },
    { cand: "c7", job: "designer", referrer: "rahul", status: "UNDER_REVIEW", relationship: "Design community", comment: "Ananya's craft is top-tier." },
    { cand: "c10", job: "ae", referrer: "tom", status: "SHORTLISTED", relationship: "Friend from Freshworks", comment: "Consistent top performer." },
  ] as const;

  for (const r of referralsData) {
    await prisma.referral.create({
      data: {
        jobId: jobs[r.job],
        candidateId: candidates[r.cand],
        referrerId: users[r.referrer],
        applicationId: appIds[`${r.cand}:${r.job}`] ?? null,
        status: r.status,
        relationship: r.relationship,
        comment: r.comment,
        createdAt: daysAgo(12),
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    jobs: await prisma.job.count(),
    candidates: await prisma.candidate.count(),
    applications: await prisma.application.count(),
    referrals: await prisma.referral.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
