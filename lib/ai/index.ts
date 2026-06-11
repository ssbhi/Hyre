/**
 * AI provider abstraction — Phase 2 readiness.
 *
 * The four planned AI capabilities are declared here as a single provider
 * interface. Today a NoopProvider returns "not configured" results so the UI can
 * already render AI affordances (disabled states, empty insights) without any
 * model wired up. In Phase 2, add e.g. a ClaudeProvider (Anthropic SDK) and
 * select it via AI_PROVIDER — no feature code changes.
 *
 * Nothing here calls a model yet. This file only fixes the contract.
 */

export interface ResumeInsights {
  summary: string;
  skills: string[];
  highlights: string[];
}

export interface MatchResult {
  score: number; // 0..1
  rationale: string;
  matchedSkills: string[];
  gaps: string[];
}

export interface AssistantAnswer {
  answer: string;
  // Optional structured references the UI can deep-link to.
  references?: { kind: "job" | "candidate" | "application"; id: string; label: string }[];
}

export interface AiProvider {
  readonly name: string;
  readonly enabled: boolean;
  parseResume(input: { text?: string; fileUrl?: string }): Promise<ResumeInsights>;
  matchCandidateToJob(input: {
    resumeText: string;
    jobDescription: string;
    requiredSkills: string[];
  }): Promise<MatchResult>;
  generateJobDescription(input: {
    title: string;
    department?: string;
    seniority?: string;
    notes?: string;
  }): Promise<string>;
  ask(input: { question: string; context?: string }): Promise<AssistantAnswer>;
}

class NoopProvider implements AiProvider {
  readonly name = "noop";
  readonly enabled = false;

  async parseResume(): Promise<ResumeInsights> {
    return { summary: "", skills: [], highlights: [] };
  }
  async matchCandidateToJob(): Promise<MatchResult> {
    return { score: 0, rationale: "AI matching is not configured.", matchedSkills: [], gaps: [] };
  }
  async generateJobDescription(): Promise<string> {
    return "";
  }
  async ask(): Promise<AssistantAnswer> {
    return { answer: "The AI assistant is not configured yet." };
  }
}

function createProvider(): AiProvider {
  // Phase 2: switch on process.env.AI_PROVIDER (e.g. "claude") and return a real
  // provider. Until then, everything routes through the no-op.
  return new NoopProvider();
}

export const ai: AiProvider = createProvider();
