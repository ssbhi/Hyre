"use server";

import { redirect } from "next/navigation";

import { repo } from "@/lib/data";
import { createSession, destroySession } from "./session";

export type LoginResult = { ok: true } | { ok: false; error: string };

/** Authenticate with email + password and open a session. */
export async function login(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Enter your email and password." };
  }

  const user = await repo.verifyCredentials(email, password);
  if (!user) {
    return { ok: false, error: "Invalid email or password." };
  }

  await createSession(user.id);
  return { ok: true };
}

/** End the session and return to the login screen. */
export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
