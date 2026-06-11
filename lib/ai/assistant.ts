/**
 * "Ask Hyre" assistant engine.
 *
 * The Phase-2 plan is a Claude-backed recruitment assistant. Until that's wired
 * (see lib/ai/index.ts), this provides a working, no-API-key fallback: a small
 * intent matcher that answers common recruiting questions by querying the real
 * data layer. The shape it returns (answer + references) is exactly what a Claude
 * provider would produce, so the UI never changes when we upgrade it.
 */
import "server-only";

import { repo } from "@/lib/data";
import type { AssistantAnswer } from "@/lib/ai";
import { STAGE_META, type PipelineStage } from "@/lib/schemas/enums";
import { relativeTime, pct } from "@/lib/format";

export const SUGGESTED_PROMPTS = [
  "Which candidates are stuck in screening?",
  "Which jobs have the most applicants?",
  "How are referrals performing?",
  "What does the hiring funnel look like?",
  "Who has an offer out?",
] as const;

type Intent =
  | "stuck"
  | "top_jobs"
  | "referrals"
  | "funnel"
  | "offers"
  | "hired"
  | "help";

function classify(q: string): Intent {
  const s = q.toLowerCase();
  if (/(stuck|screening|review|waiting|sitting)/.test(s)) return "stuck";
  if (/(most|top|popular).*(applic|candidate)|which jobs|busiest/.test(s)) return "top_jobs";
  if (/referr/.test(s)) return "referrals";
  if (/funnel|pipeline|conversion|stages?/.test(s)) return "funnel";
  if (/offer/.test(s)) return "offers";
  if (/hired|hires|joined|filled/.test(s)) return "hired";
  return "help";
}

export async function runAssistant(question: string): Promise<AssistantAnswer> {
  switch (classify(question)) {
    case "stuck": {
      const apps = await repo.listPipeline({ stage: "SCREENING" });
      if (apps.length === 0) {
        return { answer: "No candidates are currently in the Screening stage. 🎉" };
      }
      const lines = apps
        .slice(0, 8)
        .map(
          (a) =>
            `• ${a.candidate?.name ?? "Candidate"} — ${a.job?.title ?? "role"} (since ${relativeTime(a.updatedAt)})`,
        );
      return {
        answer: `${apps.length} candidate${apps.length === 1 ? " is" : "s are"} in Screening:\n${lines.join("\n")}`,
        references: apps.slice(0, 8).map((a) => ({
          kind: "application" as const,
          id: a.id,
          label: a.candidate?.name ?? "Candidate",
        })),
      };
    }

    case "top_jobs": {
      const jobs = await repo.listJobs({ status: "PUBLISHED" });
      const ranked = [...jobs]
        .sort((a, b) => (b.applicantCount ?? 0) - (a.applicantCount ?? 0))
        .slice(0, 5);
      const lines = ranked.map(
        (j, i) => `${i + 1}. ${j.title} — ${j.applicantCount ?? 0} applicant${(j.applicantCount ?? 0) === 1 ? "" : "s"}`,
      );
      return {
        answer: `Open roles by applicant volume:\n${lines.join("\n")}`,
        references: ranked.map((j) => ({ kind: "job" as const, id: j.id, label: j.title })),
      };
    }

    case "referrals": {
      const refs = await repo.listReferrals();
      const hired = refs.filter((r) => r.status === "HIRED").length;
      const active = refs.filter((r) => !["HIRED", "REJECTED"].includes(r.status)).length;
      const rate = refs.length === 0 ? 0 : hired / refs.length;
      return {
        answer: `There are ${refs.length} referrals total — ${active} still active and ${hired} hired (a ${pct(rate)} conversion rate). Employee referrals are one of your strongest sources.`,
      };
    }

    case "funnel": {
      const stats = await repo.getDashboardStats();
      const lines = stats.funnel.map((f) => `• ${f.label}: ${f.count}`);
      return { answer: `Current hiring funnel:\n${lines.join("\n")}` };
    }

    case "offers": {
      const offers = await repo.listPipeline({ stage: "OFFER_EXTENDED" });
      const accepted = await repo.listPipeline({ stage: "OFFER_ACCEPTED" });
      if (offers.length === 0 && accepted.length === 0) {
        return { answer: "No offers are currently outstanding." };
      }
      const lines = [...offers, ...accepted].map(
        (a) =>
          `• ${a.candidate?.name ?? "Candidate"} — ${a.job?.title ?? "role"} (${STAGE_META[a.stage as PipelineStage].label})`,
      );
      return {
        answer: `${offers.length} offer${offers.length === 1 ? "" : "s"} extended, ${accepted.length} accepted:\n${lines.join("\n")}`,
        references: [...offers, ...accepted].map((a) => ({
          kind: "application" as const,
          id: a.id,
          label: a.candidate?.name ?? "Candidate",
        })),
      };
    }

    case "hired": {
      const stats = await repo.getDashboardStats();
      return {
        answer: `${stats.hiredThisMonth} candidate${stats.hiredThisMonth === 1 ? " has" : "s have"} been hired this month. Across all roles, you have ${stats.totalApplications} total applications in the pipeline.`,
      };
    }

    default:
      return {
        answer:
          "I can help you understand your pipeline. Try asking:\n• Which candidates are stuck in screening?\n• Which jobs have the most applicants?\n• How are referrals performing?\n• What does the hiring funnel look like?\n• Who has an offer out?",
      };
  }
}
