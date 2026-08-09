import { OpticLogoMarks } from "@/lib/opticLogo";

export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className}>
      <OpticLogoMarks />
    </svg>
  );
}
