import { redirect } from "next/navigation";

import { Sidebar } from "@/components/app/sidebar";
import { getCurrentUser } from "@/lib/auth/session";
import { repo } from "@/lib/data";

/**
 * The signed-in HR workspace shell: dark sidebar rail + light content area. The
 * route group `(app)` keeps these URLs clean (/dashboard, /jobs, …) while sharing
 * this layout. getCurrentUser() redirects to /login when not authenticated, so
 * this layout also guards every page beneath it. Candidates have no place here —
 * they live on the public careers portal.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user.role === "CANDIDATE") redirect("/careers");

  const jobs = await repo.listJobs({ status: "PUBLISHED" });
  const jobOptions = jobs.map((j) => ({ id: j.id, title: j.title }));

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar user={user} jobs={jobOptions} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
