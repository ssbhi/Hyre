"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { setReferralStatus } from "@/lib/actions/referrals";
import { REFERRAL_STATUSES, REFERRAL_STATUS_META, type ReferralStatus } from "@/lib/schemas/enums";

export function ReferralStatusSelect({
  referralId,
  current,
}: {
  referralId: string;
  current: ReferralStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as ReferralStatus;
    if (status === current) return;
    startTransition(async () => {
      const res = await setReferralStatus(referralId, status);
      if (res.ok) {
        toast.success(`Status → ${REFERRAL_STATUS_META[status].label}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <select
      value={current}
      onChange={onChange}
      disabled={pending}
      aria-label="Update referral status"
      className="h-8 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
    >
      {REFERRAL_STATUSES.map((s) => (
        <option key={s} value={s}>
          {REFERRAL_STATUS_META[s].label}
        </option>
      ))}
    </select>
  );
}
