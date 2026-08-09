import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import AmbientBackground from "@/components/AmbientBackground";
import TrialBanner from "@/components/TrialBanner";
import { maybeSendTrialReminder } from "@/lib/plan";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.emailVerified) redirect("/verify-email");

  void maybeSendTrialReminder(user);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-base-bg text-base-text relative">
      <AmbientBackground variant="app" />
      <Sidebar displayName={user.displayName} role={user.role} />
      <main className="flex-1 min-w-0">
        <TrialBanner user={user} />
        {children}
      </main>
    </div>
  );
}
