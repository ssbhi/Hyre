import type { Metadata } from "next";

import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = { title: "Help & docs" };

export default function HelpPage() {
  return (
    <ComingSoon
      title="Help & docs"
      description="Guides for HR admins, employees, and candidates."
      slice="a later slice"
    />
  );
}
