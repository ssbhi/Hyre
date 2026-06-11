import { cn } from "@/lib/utils";

/**
 * On-brand renditions of True Balance's real certifications (Great Place to
 * Work, ISO 9001). Built with CSS so there are no image dependencies — swap in
 * the official logo PNGs in /public later if you want the exact marks.
 */

export function GreatPlaceToWorkBadge({ className }: { className?: string }) {
  return (
    <div
      title="Great Place to Work® Certified (3×, 2022–25)"
      className={cn(
        "inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-white shadow-sm",
        className,
      )}
    >
      <span className="flex flex-col leading-tight">
        <span className="text-[9px] font-semibold tracking-widest text-white/75">GREAT PLACE</span>
        <span className="text-[9px] font-semibold tracking-widest text-white/75">TO WORK®</span>
      </span>
      <span className="flex flex-col items-center rounded bg-primary px-1.5 py-0.5 leading-none text-primary-foreground">
        <span className="text-[10px] font-extrabold">CERTIFIED</span>
        <span className="text-[7px] font-medium">3× · 2022–25</span>
      </span>
    </div>
  );
}

export function Iso9001Badge({ className }: { className?: string }) {
  return (
    <div
      title="ISO 9001 Certified"
      className={cn(
        "grid size-14 place-items-center rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow ring-2 ring-amber-600/50",
        className,
      )}
    >
      <span className="flex flex-col items-center leading-none">
        <span className="text-[7px] font-bold tracking-wide">CERTIFIED</span>
        <span className="text-[13px] font-extrabold">ISO 9001</span>
        <span className="text-[7px] font-bold tracking-wide">CERTIFIED</span>
      </span>
    </div>
  );
}
