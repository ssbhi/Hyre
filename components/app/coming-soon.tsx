import { Hammer } from "lucide-react";

export function ComingSoon({
  title,
  description,
  slice,
}: {
  title: string;
  description?: string;
  slice: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="grid place-items-center rounded-xl border border-dashed py-20 text-center">
        <div className="max-w-sm space-y-2 px-4">
          <div className="mx-auto grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Hammer className="size-5" />
          </div>
          <p className="font-medium">Arriving in {slice}</p>
          <p className="text-sm text-muted-foreground">
            This area is on the roadmap. The data layer behind it is already
            built and seeded — the interface lands in an upcoming slice.
          </p>
        </div>
      </div>
    </div>
  );
}
