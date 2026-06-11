import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { JobForm } from "@/components/jobs/job-form";
import { getCurrentUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";

export const metadata: Metadata = { title: "New job" };

export default async function NewJobPage() {
  const user = await getCurrentUser();
  if (user.role !== "HR_ADMIN") redirect("/dashboard");

  const departments = await repo.listDepartments();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to jobs
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Post a new job</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details. Save as a draft or publish it live.
        </p>
      </div>
      <JobForm mode="create" departments={departments} />
    </div>
  );
}
