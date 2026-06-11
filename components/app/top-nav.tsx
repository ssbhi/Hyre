"use client";

import { ChevronDown, LifeBuoy, LogOut, Search, Settings, Users2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

import { Logo } from "@/components/brand/logo";
import { AskHyre } from "@/components/app/assistant";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRecord } from "@/lib/data";
import { logout } from "@/lib/auth/actions";
import { initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/schemas/enums";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Jobs", href: "/jobs" },
  { label: "Candidates", href: "/candidates" },
  { label: "Referrals", href: "/referrals" },
  { label: "Search", href: "/search" },
  { label: "Analytics", href: "/analytics" },
];

export function TopNav({ user }: { user: UserRecord }) {
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-1 px-4">
        <Link href="/dashboard" className="mr-3 shrink-0">
          <Logo />
        </Link>

        {/* Primary nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}

          {/* More */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground",
              )}
            >
              More
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem render={<Link href="/settings" />}>
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/settings/team" />}>
                <Users2 />
                Team &amp; access
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/help" />}>
                <LifeBuoy />
                Help &amp; docs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/search"
            aria-label="Search"
            className={cn(
              "grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            )}
          >
            <Search className="size-4" />
          </Link>
          <AskHyre />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full pr-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              <Avatar size="sm">
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium lg:inline">{user.name.split(" ")[0]}</span>
              <ChevronDown className="hidden size-3.5 text-muted-foreground lg:inline" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => startTransition(() => logout())}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
