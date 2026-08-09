export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-accent/25 blur-[120px] animate-float-glow" />
      <div className="absolute bottom-[-200px] right-[-160px] w-[480px] h-[480px] rounded-full bg-accent-2/20 blur-[130px] animate-float-glow" style={{ animationDelay: "3s" }} />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
