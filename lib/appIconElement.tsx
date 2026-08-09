import { OpticLogoMarks } from "./opticLogo";

export function AppIconElement({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="10" fill="#0b0c15" />
      <OpticLogoMarks />
    </svg>
  );
}
