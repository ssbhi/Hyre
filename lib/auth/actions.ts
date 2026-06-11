"use server";

import { redirect } from "next/navigation";

import { repo } from "@/lib/data";
import { createSession, destroySession } from "./session";
import { hashPassword } from "./password";

export type LoginResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Candidate self-service signup. Creates a CANDIDATE account and signs them in. */
export async function signup(formData: FormData): Promise<LoginResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { ok: false, error: "Enter your full name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

  const existing = await repo.getUserByEmail(email);
  if (existing) {
    return { ok: false, error: "An account with this email already exists — sign in instead." };
  }

  const user = await repo.createUser({
    name,
    email,
    role: "CANDIDATE",
    passwordHash: hashPassword(password),
  });
  await createSession(user.id);
  return { ok: true };
}

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
