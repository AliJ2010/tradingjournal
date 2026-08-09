export function OpticLogoMarks() {
  return (
    <>
      <defs>
        <linearGradient id="optic-t-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="40" stroke="url(#optic-t-grad)" strokeWidth="3" fill="none" />
      <g stroke="url(#optic-t-grad)" strokeWidth="3" strokeLinecap="round">
        <line x1="50" y1="3" x2="50" y2="11" />
        <line x1="50" y1="89" x2="50" y2="97" />
        <line x1="3" y1="50" x2="11" y2="50" />
        <line x1="89" y1="50" x2="97" y2="50" />
      </g>
      <path d="M58.9,25.56 A26,26 0 0 1 58.9,74.44" stroke="url(#optic-t-grad)" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M41.1,74.44 A26,26 0 0 1 41.1,25.56" stroke="url(#optic-t-grad)" strokeWidth="14" strokeLinecap="round" fill="none" />
      <g stroke="#1e1b4b" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.55">
        <path d="M64,36 Q68,32 70,37 Q73,33 76,38" />
        <path d="M64,64 Q68,68 70,63 Q73,67 76,62" />
        <path d="M36,64 Q32,68 30,63 Q27,67 24,62" />
        <path d="M36,36 Q32,32 30,37 Q27,33 24,38" />
      </g>
      <rect x="36" y="35" width="28" height="10" rx="2" fill="url(#optic-t-grad)" />
      <rect x="45" y="35" width="10" height="30" rx="2" fill="url(#optic-t-grad)" />
    </>
  );
}
