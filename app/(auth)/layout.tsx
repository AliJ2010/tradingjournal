import AmbientBackground from "@/components/AmbientBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base-bg flex items-center justify-center px-4 relative">
      <AmbientBackground />
      <div className="w-full max-w-sm relative z-10">{children}</div>
    </div>
  );
}
