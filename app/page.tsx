import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Globe,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { repo } from "@/lib/data";
import { ACTIVE_PIPELINE_STAGES, STAGE_META } from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Briefcase,
    title: "Job management",
    body: "Create, publish, duplicate, and archive roles. Track openings and hiring managers per department.",
  },
  {
    icon: Workflow,
    title: "Visual ATS pipeline",
    body: "Move candidates across a 10-stage kanban with notes, interview feedback, and a full timeline.",
  },
  {
    icon: Users,
    title: "Employee referrals",
    body: "Let employees refer candidates in two clicks and track conversion from referral to hire.",
  },
  {
    icon: Globe,
    title: "Career portal",
    body: "A fast, public careers page with search, filters, and a polished application experience.",
  },
  {
    icon: BarChart3,
    title: "Pipeline analytics",
    body: "A hiring funnel, stage breakdowns, and referral stats — visibility without the spreadsheets.",
  },
  {
    icon: Sparkles,
    title: "AI-ready",
    body: "Architected for resume insights, candidate matching, and a recruitment assistant — wired in later.",
  },
];

export default async function HomePage() {
  const jobs = await repo.listPublishedJobs();
  const departments = new Set(jobs.map((j) => j.department));
  const openings = jobs.reduce((sum, j) => sum + j.openings, 0);

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#pipeline" className="transition-colors hover:text-foreground">Pipeline</a>
            <Link href="/careers" className="transition-colors hover:text-foreground">Careers</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}
            >
              Sign in
            </Link>
            <Link href="/careers" className={cn(buttonVariants({ size: "sm" }))}>
              View careers
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]"
        />
        <div className="mx-auto w-full max-w-6xl px-5 py-20 text-center sm:py-28">
          <Reveal>
            <Badge variant="secondary" className="mb-5 gap-1.5">
              <Sparkles className="size-3.5" />
              AI-ready ATS + referrals
            </Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              Hiring &amp; referrals,{" "}
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                in one flow
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              Hyre replaces the recruiting spreadsheet with a premium applicant
              tracking system and employee referral platform — built for HR
              teams that move fast.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/careers" className={cn(buttonVariants({ size: "lg" }), "h-11 px-6")}>
                Browse open roles
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-6")}
              >
                Open HR dashboard
              </Link>
            </div>
          </Reveal>

          {/* Live stats, pulled from the data layer */}
          <Reveal delay={0.2}>
            <dl className="mx-auto mt-14 grid max-w-lg grid-cols-3 gap-4">
              {[
                { label: "Open roles", value: jobs.length },
                { label: "Openings", value: openings },
                { label: "Departments", value: departments.size },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border bg-card/50 p-4">
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything HR needs, nothing it doesn&apos;t
          </h2>
          <p className="mt-2 text-muted-foreground">
            A focused toolset for the full hiring lifecycle.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-4.5" />
                </div>
                <CardTitle className="mt-3">{f.title}</CardTitle>
                <CardDescription>{f.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Pipeline strip */}
      <section id="pipeline" className="border-y bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              A pipeline you can see
            </h2>
            <p className="mt-2 text-muted-foreground">
              Every candidate moves through clear, configurable stages.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {ACTIVE_PIPELINE_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-2">
                <span className="rounded-full border bg-card px-3 py-1.5 text-sm font-medium shadow-sm">
                  {STAGE_META[stage].label}
                </span>
                {i < ACTIVE_PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Built for the internal AI Hackathon
          </p>
        </div>
      </footer>
    </div>
  );
}
