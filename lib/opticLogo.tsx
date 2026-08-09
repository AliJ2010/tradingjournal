export function OpticLogoMarks() {
  return (
    <>
      <defs>
        <linearGradient id="optic-t-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="38" stroke="url(#optic-t-grad)" strokeWidth="7" fill="none" />
      <g stroke="url(#optic-t-grad)" strokeWidth="7" strokeLinecap="round">
        <line x1="50" y1="12" x2="50" y2="4" />
        <line x1="50" y1="88" x2="50" y2="96" />
        <line x1="12" y1="50" x2="4" y2="50" />
        <line x1="88" y1="50" x2="96" y2="50" />
      </g>
      <path d="M58.9,25.56 A26,26 0 0 1 58.9,74.44" stroke="url(#optic-t-grad)" strokeWidth="24" strokeLinecap="round" fill="none" />
      <path d="M41.1,74.44 A26,26 0 0 1 41.1,25.56" stroke="url(#optic-t-grad)" strokeWidth="24" strokeLinecap="round" fill="none" />
      <g stroke="#3730a3" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85">
        <path d="M62,34 Q67,28 70,35 Q73,29 76,36" />
        <path d="M62,66 Q67,72 70,65 Q73,71 76,64" />
        <path d="M38,66 Q33,72 30,65 Q27,71 24,64" />
        <path d="M38,34 Q33,28 30,35 Q27,29 24,36" />
      </g>
      <rect x="32" y="33" width="36" height="14" rx="2" fill="url(#optic-t-grad)" />
      <rect x="43" y="33" width="14" height="34" rx="2" fill="url(#optic-t-grad)" />
    </>
  );
}
