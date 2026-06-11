import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = { title: "Team & access" };

export default function TeamPage() {
  return (
    <ComingSoon
      title="Team & access"
      description="Manage HR team members and role-based access."
      slice="a later slice"
    />
  );
}
