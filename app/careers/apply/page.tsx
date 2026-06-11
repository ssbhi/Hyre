import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { CandidateAuth } from "@/components/careers/candidate-auth";
import { MultiApplyForm } from "@/components/careers/multi-apply-form";
import { getSessionUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";

export const metadata: Metadata = { title: "Apply" };

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ jobs?: string }>;
}) {
  const sp = await searchParams;
  const ids = [...new Set((sp.jobs ?? "").split(",").map((s) => s.trim()).filter(Boolean))];

  const loaded = await Promise.all(ids.map((id) => repo.getJobById(id)));
  const jobs = loaded
    .filter((j): j is NonNullable<typeof j> => !!j && j.status === "PUBLISHED")
    .map((j) => ({ id: j.id, title: j.title }));

  const user = jobs.length > 0 ? await getSessionUser() : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link
        href="/careers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All roles
      </Link>

      {jobs.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold">No roles selected</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Head back to the careers page and pick a role to apply for.
          </p>
        </div>
      ) : user ? (
        <div className="mt-6 space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Complete your application</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed in as {user.email}. Fill in your details below.
            </p>
          </div>
          <MultiApplyForm jobs={jobs} user={{ name: user.name, email: user.email }} />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in to apply</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;re applying to {jobs.length} role{jobs.length === 1 ? "" : "s"}. Create a
              candidate account or sign in to continue.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <ul className="flex flex-wrap gap-1.5">
              {jobs.map((j) => (
                <li key={j.id} className="rounded-full bg-background px-2.5 py-1 text-xs font-medium">
                  {j.title}
                </li>
              ))}
            </ul>
          </div>
          <CandidateAuth />
        </div>
      )}
    </div>
  );
}
