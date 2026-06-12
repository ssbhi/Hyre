import type { Metadata } from "next";

import { CareersBrowser } from "@/components/careers/careers-browser";
import { Reveal } from "@/components/motion/reveal";
import { repo } from "@/lib/data";

export const metadata: Metadata = {
  title: "Careers",
  description: "Open roles at True Hire. Browse and apply.",
};

// Jobs come from the database — render per request, never bake at build time.
export const dynamic = "force-dynamic";

export default async function CareersPage() {
  const jobs = await repo.listPublishedJobs();
  const departments = [...new Set(jobs.map((j) => j.department))].sort();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent)]"
        />
        <div className="mx-auto w-full max-w-5xl px-5 py-16 text-center sm:py-20">
          <Reveal>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Build the future with us
            </h1>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              We&apos;re hiring across engineering, design, product, and more.
              Find a role that fits and apply in minutes.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Listings */}
      <section className="mx-auto w-full max-w-5xl px-5 py-10">
        <CareersBrowser jobs={jobs} departments={departments} />
      </section>
    </div>
  );
}
