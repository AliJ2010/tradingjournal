import AmbientBackground from "@/components/AmbientBackground";
import InstallPwaHint from "@/components/InstallPwaHint";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base-bg flex flex-col items-center justify-center px-4 py-8 relative">
      <AmbientBackground />
      <div className="w-full max-w-sm relative z-10">{children}</div>
      <div className="relative z-10 mt-6">
        <InstallPwaHint />
      </div>
    </div>
  );
}
