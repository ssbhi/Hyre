"use server";

import { redirect } from "next/navigation";

import { repo } from "@/lib/data";
import { createSession, destroySession } from "./session";
import { hashPassword } from "./password";

export type LoginResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Company emails allowed to sign in as HR Admin. Until Google SSO is wired,
 * these sign in with email + password; the FIRST sign-in provisions the HR
 * account and sets that password. Only these emails get HR access this way.
 */
const HR_ALLOWLIST = [
  "shobhit.soni.ap@balancehero.com",
  "pawan.dobhal@truecredits.in",
  "sudhir.yadav@truecredits.in",
];

function nameFromEmail(email: string): string {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

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

  // Allowlisted company emails sign in as HR Admin. First sign-in provisions
  // the account and sets the password; later sign-ins verify it.
  if (HR_ALLOWLIST.includes(email)) {
    if (password.length < 6) {
      return { ok: false, error: "Choose a password of at least 6 characters." };
    }
    const existing = await repo.getUserByEmail(email);
    if (!existing) {
      const created = await repo.createUser({
        name: nameFromEmail(email),
        email,
        role: "HR_ADMIN",
        passwordHash: hashPassword(password),
      });
      await createSession(created.id);
      return { ok: true };
    }
    const verified = await repo.verifyCredentials(email, password);
    if (!verified) {
      return { ok: false, error: "Invalid email or password." };
    }
    // Allowlisted company emails always get HR access — promote the account if
    // it was first created as a candidate (e.g. via the apply flow).
    if (verified.role !== "HR_ADMIN") {
      await repo.upsertUser({ name: verified.name, email, role: "HR_ADMIN" });
    }
    await createSession(verified.id);
    return { ok: true };
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
