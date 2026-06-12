"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Site brand lockup: a small logo mark + the "True Hire" wordmark.
 *
 * The mark loads from /public/true-balance-logo.webp. Replace that file to swap
 * the logo everywhere; if it's ever missing it falls back to the same path, so
 * there's never a broken image.
 */
const PRIMARY_LOGO = "/true-balance-logo.webp";
const FALLBACK_LOGO = "/true-balance-logo.webp";

export function CompanyLogo({ className }: { className?: string }) {
  const [src, setSrc] = useState(PRIMARY_LOGO);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-flex items-center rounded-md bg-white px-1.5 py-1 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="True Hire"
          onError={() => {
            if (src !== FALLBACK_LOGO) setSrc(FALLBACK_LOGO);
          }}
          className="h-5 w-auto"
        />
      </span>
      <span
        className="text-2xl font-semibold tracking-tight text-foreground"
        style={{ fontFamily: "var(--font-wordmark)" }}
      >
        True Hire
      </span>
    </span>
  );
}
