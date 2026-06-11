import Link from "next/link";

import { CompanyLogo } from "@/components/brand/company-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
          <Link href="/">
            <CompanyLogo />
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            HR sign in
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-auto border-t">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-8 text-sm text-muted-foreground">
          <CompanyLogo />
          <span>Careers at True Hire</span>
        </div>
      </footer>
    </div>
  );
}
