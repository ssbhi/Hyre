"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { assignRecruiter } from "@/lib/actions/pipeline";

export function RecruiterSelect({
  applicationId,
  current,
  recruiters,
}: {
  applicationId: string;
  current: string | null;
  recruiters: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null;
    startTransition(async () => {
      const res = await assignRecruiter(applicationId, value);
      if (res.ok) {
        toast.success("Recruiter updated");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <select
      value={current ?? ""}
      onChange={onChange}
      disabled={pending}
      aria-label="Assign recruiter"
      className="h-8 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
    >
      <option value="">Unassigned</option>
      {recruiters.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </select>
  );
}
