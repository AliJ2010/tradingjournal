import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import AmbientBackground from "@/components/AmbientBackground";
import TrialBanner from "@/components/TrialBanner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-base-bg text-base-text relative">
      <AmbientBackground />
      <Sidebar displayName={user.displayName} role={user.role} />
      <main className="flex-1 min-w-0">
        <TrialBanner user={user} />
        {children}
      </main>
    </div>
  );
}
