import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { CandidateAuth } from "@/components/careers/candidate-auth";
import { buttonVariants } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { getSessionUser } from "@/lib/auth/session";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getSessionUser();

  return (
    <div className="mx-auto w-full max-w-sm px-5 py-16">
      <Link
        href="/careers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Open roles
      </Link>

      <div className="mt-6">
        {user ? (
          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {initials(user.name)}
            </div>
            <h1 className="mt-4 text-lg font-semibold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Link
              href="/careers"
              className={cn(buttonVariants(), "mt-6 w-full")}
            >
              Browse open roles
            </Link>
            <form action={logout} className="mt-2">
              <button
                type="submit"
                className={cn(buttonVariants({ variant: "ghost" }), "w-full")}
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="mb-5 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Candidate account</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in or create an account to apply and track your applications.
              </p>
            </div>
            <CandidateAuth redirectTo="/careers" />
          </>
        )}
      </div>
    </div>
  );
}
