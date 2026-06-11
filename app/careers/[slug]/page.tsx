import type { Metadata } from "next";
import { ArrowLeft, Briefcase, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplyForm } from "@/components/careers/apply-form";
import { repo } from "@/lib/data";
import { EMPLOYMENT_TYPE_LABELS, LOCATION_TYPE_LABELS } from "@/lib/schemas/enums";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await repo.getJobBySlug(slug);
  return { title: job ? `${job.title} — Careers` : "Careers" };
}

export default async function CareerJobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await repo.getJobBySlug(slug);
  if (!job || job.status !== "PUBLISHED") notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <Link
        href="/careers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All roles
      </Link>

      {/* Header */}
      <div className="mt-5">
        <h1 className="text-3xl font-semibold tracking-tight">{job.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="size-4" />
            {job.department} · {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" />
            {job.location} ({LOCATION_TYPE_LABELS[job.locationType]})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" />
            {job.openings} opening{job.openings === 1 ? "" : "s"}
          </span>
        </div>
        <a
          href="#apply"
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Apply for this role
        </a>
      </div>

      {/* About */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">About the role</h2>
        <p className="mt-2 text-sm whitespace-pre-wrap text-foreground/90">{job.description}</p>
      </section>

      {job.requiredSkills.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">What we&apos;re looking for</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.requiredSkills.map((s) => (
              <span key={s} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Apply */}
      <section id="apply" className="mt-10 scroll-mt-20 border-t pt-8">
        <h2 className="text-xl font-semibold tracking-tight">Apply for {job.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about yourself. Fields marked * are required.
        </p>
        <div className="mt-6">
          <ApplyForm jobId={job.id} jobTitle={job.title} />
        </div>
      </section>
    </div>
  );
}
