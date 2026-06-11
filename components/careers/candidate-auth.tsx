"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { login, signup } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CandidateAuth({
  redirectTo,
  defaultMode = "signup",
}: {
  redirectTo?: string;
  defaultMode?: "signin" | "signup";
} = {}) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = mode === "signup" ? await signup(fd) : await login(fd);
      if (res.ok) {
        if (redirectTo) router.replace(redirectTo);
        router.refresh(); // re-render authenticated (apply page shows the form)
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex gap-1 rounded-lg border bg-muted/40 p-1">
        {(["signup", "signin"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
              mode === m ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {mode === "signup"
          ? "Create a candidate account to apply and track your applications."
          : "Welcome back — sign in to continue your application."}
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">Full name</label>
            <Input id="name" name="name" autoComplete="name" required />
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={pending} className="h-10 w-full">
          {pending ? "Please wait…" : mode === "signup" ? "Create account & continue" : "Sign in & continue"}
        </Button>
      </form>
    </div>
  );
}
