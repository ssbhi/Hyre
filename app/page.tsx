import { ArrowRight, BadgeCheck, Briefcase, Building2, Sparkles, Star, Users } from "lucide-react";
import Link from "next/link";

import { CompanyLogo } from "@/components/brand/company-logo";
import { GreatPlaceToWorkBadge, Iso9001Badge } from "@/components/brand/trust-badges";
import { TeamAvatar } from "@/components/brand/team-avatar";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { repo } from "@/lib/data";
import { ACTIVE_PIPELINE_STAGES, STAGE_META } from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

const aboutStats = [
  { value: "70M+", label: "Users across India" },
  { value: "US$85M+", label: "Raised from global investors" },
  { value: "4.5★", label: "On Google Play" },
  { value: "2014", label: "Founded" },
];

// Real Google Play reviews from True Balance users.
const testimonials = [
  {
    quote:
      "It's too easy and the disbursal process is so fast — an awesome experience, so much helpful.",
    name: "Soyaib Mahammad",
    role: "Google Play review",
  },
  {
    quote:
      "Excellent performance — within 5 minutes my loan was credited to my bank account.",
    name: "Lalit Salvi",
    role: "Google Play review",
  },
  {
    quote:
      "Wonderful app! Very easy and fast, and the customer service is very helpful and supportive.",
    name: "Nutan Salame",
    role: "Google Play review",
  },
];

// Real leadership from True Balance. Photos load from /public/team/<file> when
// present, else fall back to initials (see TeamAvatar). Names/titles are factual.
const leadership = [
  { name: "Charlie Lee", title: "Founder & CEO", bio: "Ex-RealNetworks · MPP, University of Chicago", photo: "/team/charlie-lee.jpg" },
  { name: "Jay Yi", title: "Co-Founder & CPTO", bio: "Founder of pxd · MDes, Carnegie Mellon", photo: "/team/jay-yi.jpg" },
  { name: "Soumyajit Ghosh", title: "Chief Operating Officer", bio: "18+ yrs · ISI alumnus, fintech analytics", photo: "/team/soumyajit-ghosh.jpg" },
  { name: "Anupam Vasdani", title: "Group CFO", bio: "20+ yrs · Fundraising & investor relations", photo: "/team/anupam-vasdani.jpg" },
  { name: "Debarya Dutta", title: "Chief AI Officer", bio: "MS in AI, Cambridge · ex-Uber", photo: "/team/debarya-dutta.jpg" },
  { name: "Jack Yoon", title: "Chief PI Officer", bio: "17+ yrs · Serial entrepreneur", photo: "/team/jack-yoon.jpg" },
  { name: "Gaurav Sharma", title: "CHRO", bio: "22+ yrs · ex-HR Director, Gionee India", photo: "/team/gaurav-sharma.jpg" },
  { name: "Sayantan Ghosh", title: "Chief Risk Officer", bio: "12+ yrs · ML & risk, ex-American Express", photo: "/team/sayantan-ghosh.jpg" },
];

// Job counts come from the database — render per request, never bake at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const jobs = await repo.listPublishedJobs();
  const departments = new Set(jobs.map((j) => j.department));
  const openings = jobs.reduce((sum, j) => sum + j.openings, 0);

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <CompanyLogo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#about" className="transition-colors hover:text-foreground">About us</a>
            <a href="#process" className="transition-colors hover:text-foreground">How it works</a>
            <Link href="/careers" className="transition-colors hover:text-foreground">Open roles</Link>
            <Link href="/refer" className="transition-colors hover:text-foreground">Refer someone</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/careers/account"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}
            >
              Log in / Sign up
            </Link>
            <Link
              href="/refer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Refer someone
            </Link>
            <Link href="/careers" className={cn(buttonVariants({ size: "sm" }))}>
              View open roles
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent)]"
        />
        <div className="mx-auto w-full max-w-6xl px-5 py-20 text-center sm:py-28">
          <Reveal>
            <Badge variant="secondary" className="mb-5 gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              Now hiring across the team
            </Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto max-w-3xl text-balance text-5xl font-extrabold tracking-tight sm:text-7xl">
              Hiring &amp; referrals,{" "}
              <span className="bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
                in one flow
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-5 text-xl font-bold tracking-tight text-primary sm:text-2xl">
              Hire Smarter to Grow Faster !!!
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Discover and apply to open roles across True Balance in just a few
              minutes — with your personal information kept secure and private,
              used only for your application and never shared.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex items-center justify-center">
              <Link href="/careers" className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-base")}>
                Browse open roles
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>

          {/* Live stats, pulled from the data layer */}
          <Reveal delay={0.2}>
            <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4">
              {[
                { label: "Open roles", value: jobs.length, icon: Briefcase },
                { label: "Openings", value: openings, icon: Users },
                { label: "Departments", value: departments.size, icon: Building2 },
              ].map((s) => (
                <div
                  key={s.label}
                  className="group rounded-2xl border bg-gradient-to-b from-card to-primary/5 p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <span className="mx-auto grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <s.icon className="size-5" />
                  </span>
                  <dd className="mt-3 text-4xl font-extrabold tabular-nums text-primary">{s.value}</dd>
                  <dt className="mt-0.5 text-sm font-medium text-muted-foreground">{s.label}</dt>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Trust & certifications */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-8">
          <p className="text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Trusted, certified &amp; recognised
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <GreatPlaceToWorkBadge />
            <Iso9001Badge />
            {["RBI-registered NBFC", "PPI Licensed", "Backed by SoftBank · Naver · Line"].map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium"
              >
                <BadgeCheck className="size-4 text-primary" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* About us */}
      <section id="about" className="mx-auto w-full max-w-6xl px-5 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">About us</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              We&apos;re building finance for the next billion
            </h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                True Balance (formerly Balancehero) is a Korean fintech company on a
                mission of{" "}
                <span className="font-medium text-foreground">&ldquo;Finance for All&rdquo;</span> —
                using AI to drive financial inclusion across India. Founded in 2014 by
                CEO Cheol-won Lee, it aims to be the go-to platform for India&apos;s next
                billion people.
              </p>
              <p>
                Backed by over <span className="font-medium text-foreground">US$85M</span>{" "}
                from global investors including SoftBank, Naver and Line, True Balance
                serves low- and middle-income, underserved users through an AI-based
                finance decisioning platform — alternative credit scoring, product
                comparison and recommendations.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-foreground">
                  <BadgeCheck className="size-3.5 text-primary" /> RBI-registered NBFC (True Credits)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-foreground">
                  <BadgeCheck className="size-3.5 text-primary" /> PPI-licensed entity
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {aboutStats.map((s) => (
              <div key={s.label} className="rounded-2xl border bg-card p-6">
                <p className="text-3xl font-extrabold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="process" className="border-y bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-2 text-muted-foreground">
              A clear, transparent process — you&apos;ll always know which stage
              you&apos;re at, from applied to offer.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {ACTIVE_PIPELINE_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-2">
                <span className="rounded-full border bg-card px-3 py-1.5 text-sm font-medium shadow-sm">
                  {STAGE_META[stage].label}
                </span>
                {i < ACTIVE_PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className="size-4 shrink-0 text-primary/40" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Life at True Balance</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Meet our leadership</h2>
            <p className="mt-2 text-muted-foreground">
              You&apos;ll be joining a team led by operators from across global tech and finance.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {leadership.map((m) => (
              <Card key={m.name}>
                <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                  <TeamAvatar src={m.photo} name={m.name} />
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm font-medium text-primary">{m.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{m.bio}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="mx-auto w-full max-w-6xl px-5 py-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Rated 4.5★ on Google Play</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Loved by our users
          </h2>
          <p className="mt-2 text-muted-foreground">
            #1 for &ldquo;Personal Loan&rdquo; on the Play Store, with 70M+ users across India.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-4 py-6">
                <div className="flex gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="flex-1 text-pretty text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 border-t pt-4">
                  <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {t.name.split(" ").map((w) => w[0]).join("")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary/5">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready when you are</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Take a look at the open roles — applying takes just a few minutes.
          </p>
          <Link href="/careers" className={cn(buttonVariants({ size: "lg" }), "mt-6 h-11 px-6 text-base")}>
            Browse open roles
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="mt-auto border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <CompanyLogo />
          <p className="text-sm text-muted-foreground">Your application, always private.</p>
        </div>
      </footer>
    </div>
  );
}
