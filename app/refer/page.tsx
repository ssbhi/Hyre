import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { CompanyLogo } from "@/components/brand/company-logo";
import { PublicReferForm } from "@/components/referrals/public-refer-form";
import { repo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Refer someone — True Hire",
  description: "Know someone great? Refer them for an open role.",
};

export default async function ReferPage() {
  const jobs = await repo.listPublishedJobs();
  const jobOptions = jobs.map((j) => ({ id: j.id, title: j.title }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
          <Link href="/">
            <CompanyLogo />
          </Link>
          <Link
            href="/login"
            className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            HR sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back home
        </Link>

        <div className="mt-5 mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Refer someone you know</h1>
          <p className="mt-2 text-muted-foreground">
            Great people know great people. Refer someone for an open role and we&apos;ll take it
            from there — you can track it with our team.
          </p>
        </div>

        {jobOptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card py-16 text-center text-sm text-muted-foreground">
            No open roles to refer for right now. Please check back soon.
          </div>
        ) : (
          <PublicReferForm jobs={jobOptions} />
        )}
      </main>
    </div>
  );
}
