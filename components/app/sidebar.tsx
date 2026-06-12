"use client";

import {
  ArrowRightLeft,
  Briefcase,
  LayoutDashboard,
  LogOut,
  Plus,
  Repeat,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

import type { UserRecord } from "@/lib/data";
import { logout } from "@/lib/auth/actions";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PostJobDialog } from "@/components/jobs/post-job-dialog";
import { AddCandidateDialog } from "@/components/referrals/add-candidate-dialog";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Job board", href: "/jobs", icon: Briefcase },
  { label: "Pipeline", href: "/candidates", icon: ArrowRightLeft },
  { label: "Referrals", href: "/referrals", icon: Repeat },
];

/**
 * The staff workspace sidebar — dark navy rail with brand, primary nav, the two
 * quick-action buttons, and the signed-in user. Scoped styling (its own dark
 * palette) so it doesn't depend on the global orange theme used by the public
 * careers/login pages.
 */
export function Sidebar({
  user,
  jobs,
}: {
  user: UserRecord;
  jobs: { id: string; title: string }[];
}) {
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-[#0c1424] text-slate-300">
      {/* Brand */}
      <div className="px-6 pb-6 pt-7">
        <Link href="/dashboard" className="text-2xl font-bold tracking-tight">
          <span className="text-white">True Hire</span>{" "}
          <span className="text-violet-400">HR</span>
        </Link>
        <p className="mt-1 text-xs text-slate-400">Hiring &amp; referrals, one loop</p>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-violet-600 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Quick actions */}
      <div className="space-y-2 px-3 pb-3">
        <AddCandidateDialog
          jobs={jobs}
          defaultSource="DIRECT"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          <Plus className="size-4" />
          Add candidate / referral
        </AddCandidateDialog>
        <PostJobDialog className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-white">
          <Plus className="size-4" />
          Post a job
        </PostJobDialog>
      </div>

      {/* User */}
      <div className="flex items-center gap-2.5 border-t border-white/10 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-violet-600 text-xs font-semibold text-white">
          {initials(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <p className="truncate text-xs text-slate-400">{user.email}</p>
        </div>
        <button
          type="button"
          aria-label="Sign out"
          onClick={() => startTransition(() => logout())}
          className="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </aside>
  );
}
