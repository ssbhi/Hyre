import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/brand/logo";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  // Already signed in? Go straight to the workspace.
  if (await getSessionUser()) redirect("/dashboard");

  return (
    <main className="grid min-h-full place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight">Sign in to Hyre</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back. Enter your credentials to continue.
          </p>
          <div className="mt-5">
            <LoginForm />
          </div>
          <div className="mt-4 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Demo login</span> ·
            shobhit.soni@hyre.dev / hyre1234
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Looking for a job?{" "}
          <Link href="/careers" className="text-primary hover:underline">
            View open roles
          </Link>
        </p>
      </div>
    </main>
  );
}
