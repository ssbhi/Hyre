"use client";

import { useState } from "react";

import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Shows a real headshot from `src` (e.g. /team/charlie-lee.jpg). If the file
 * isn't present yet (or fails to load), it falls back to a clean initials
 * monogram — so there are never broken images or fake stock photos. Drop the
 * real photos into /public/team to light them up.
 */
export function TeamAvatar({
  src,
  name,
  className,
}: {
  src?: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={cn("size-16 rounded-full object-cover ring-2 ring-primary/20", className)}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={cn(
        "grid size-16 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary ring-2 ring-primary/20",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
