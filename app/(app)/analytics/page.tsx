import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <ComingSoon
      title="Analytics"
      description="Deeper hiring funnel, time-to-hire, and source-of-hire reporting."
      slice="Slice 7 — Analytics"
    />
  );
}
