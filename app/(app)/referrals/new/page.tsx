import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ReferForm } from "@/components/referrals/refer-form";
import { repo } from "@/lib/data";

export const metadata: Metadata = { title: "Refer a candidate" };

export default async function NewReferralPage() {
  const jobs = await repo.listPublishedJobs();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/referrals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to referrals
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Refer a candidate</h1>
        <p className="text-sm text-muted-foreground">
          Know someone great? Refer them and we&apos;ll take it from here.
        </p>
      </div>
      <ReferForm jobs={jobs.map((j) => ({ id: j.id, title: j.title }))} />
    </div>
  );
}
