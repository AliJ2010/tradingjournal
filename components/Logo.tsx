export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <defs>
        <linearGradient id="optictrader-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5f5ef5" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <g stroke="url(#optictrader-logo-grad)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M32 10 L42 18 L38 30 Z" />
        <path d="M54 26 L50 38 L38 38 Z" />
        <path d="M46 52 L34 50 L38 38 Z" />
        <path d="M18 52 L14 40 L26 38 Z" />
        <path d="M10 26 L18 18 L26 30 Z" />
      </g>
    </svg>
  );
}
