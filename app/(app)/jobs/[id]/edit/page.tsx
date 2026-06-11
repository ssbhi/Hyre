import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { JobForm } from "@/components/jobs/job-form";
import { getCurrentUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";
import type { JobInput } from "@/lib/schemas";

export const metadata: Metadata = { title: "Edit job" };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user.role !== "HR_ADMIN") redirect("/dashboard");

  const { id } = await params;
  const [job, departments] = await Promise.all([repo.getJobById(id), repo.listDepartments()]);
  if (!job) notFound();

  const defaultValues: Partial<JobInput> = {
    title: job.title,
    department: job.department,
    employmentType: job.employmentType,
    locationType: job.locationType,
    location: job.location,
    openings: job.openings,
    status: job.status,
    requiredSkills: job.requiredSkills,
    description: job.description,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href={`/jobs/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to job
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit job</h1>
        <p className="text-sm text-muted-foreground">{job.title}</p>
      </div>
      <JobForm mode="edit" jobId={id} defaultValues={defaultValues} departments={departments} />
    </div>
  );
}
