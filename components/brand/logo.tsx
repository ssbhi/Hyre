import { cn } from "@/lib/utils";

/**
 * Hyre wordmark + mark. The mark is a rounded gradient tile with an "H" cut
 * into a chevron, hinting at a pipeline moving forward.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-violet-500 text-primary-foreground shadow-sm">
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" aria-hidden>
          <path
            d="M6 5v14M6 12h8M14 5v14"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="m17 8 3 4-3 4"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">Hyre</span>
      )}
    </span>
  );
}
