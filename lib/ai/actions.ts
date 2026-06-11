"use server";

import { getCurrentUser } from "@/lib/auth/session";

import { ai, type AssistantAnswer } from "./index";
import { runAssistant } from "./assistant";

/**
 * Answer a question for the Ask Hyre assistant. Routes to the configured AI
 * provider when one is enabled (Phase 2), otherwise to the deterministic engine.
 */
export async function askAssistant(question: string): Promise<AssistantAnswer> {
  // Server actions are publicly reachable — require a signed-in user.
  await getCurrentUser();

  const trimmed = question.trim();
  if (!trimmed) return { answer: "Ask me something about your pipeline." };

  if (ai.enabled) return ai.ask({ question: trimmed });
  return runAssistant(trimmed);
}
