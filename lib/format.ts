/** Small presentation helpers shared across the UI. */

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "today", "3 days ago", "2 weeks ago" — from an ISO string. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffDays = Math.round((then - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, "day");
  if (Math.abs(diffDays) < 30) return rtf.format(Math.round(diffDays / 7), "week");
  return rtf.format(Math.round(diffDays / 30), "month");
}

/** "Jun 10, 2026" — from an ISO string. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}
