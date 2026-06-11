import { TopNav } from "@/components/app/top-nav";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * The signed-in HR workspace shell: top nav ribbon + page container. The route
 * group `(app)` keeps these URLs clean (/dashboard, /jobs, …) while sharing this
 * layout. getCurrentUser() redirects to /login when not authenticated, so this
 * layout also guards every page beneath it.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-col">
      <TopNav user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
