/**
 * Authenticated session.
 *
 * The session is an httpOnly cookie holding `${userId}.${hmac(userId)}`, signed
 * with AUTH_SECRET so it can't be forged. getCurrentUser() resolves the signed-in
 * user or redirects to /login — so importing it in a Server Component or action
 * both reads the user AND protects the route.
 */
import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { repo } from "@/lib/data";
import type { UserRecord } from "@/lib/data";

export const SESSION_COOKIE = "hyre_session";
const SECRET = process.env.AUTH_SECRET || "dev-insecure-secret-change-me-in-prod";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

function makeToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

function parseToken(token: string): string | null {
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const id = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = sign(id);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}

/** Set the session cookie. Call only from a Server Action / Route Handler. */
export async function createSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, makeToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** The signed-in user, or null if not authenticated. */
export async function getSessionUser(): Promise<UserRecord | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const id = token ? parseToken(token) : null;
  if (!id) return null;
  return repo.getUserById(id);
}

/** The signed-in user, or redirect to /login. Use in protected pages/actions. */
export async function getCurrentUser(): Promise<UserRecord> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
