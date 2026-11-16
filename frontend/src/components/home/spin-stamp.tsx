/** Round badge with text that slowly turns around a scoop. Pure SVG and CSS. */
export function SpinStamp({ className = "relative" }: { className?: string }) {
  const text = "FRESHLY CHURNED • DELIVERED COLD • MADE WITH LOVE • ";
  return (
    <div className={`size-32 sm:size-36 ${className}`} aria-hidden>
      <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 size-full">
        <defs>
          <path id="stamp-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <circle cx="100" cy="100" r="98" fill="#fbcd0a" />
        <circle cx="100" cy="100" r="62" fill="#fffbef" />
        <text fill="#2a1f1d" fontSize="15" fontWeight="700" letterSpacing="3.2" fontFamily="var(--font-heading), sans-serif">
          <textPath href="#stamp-circle">{text}</textPath>
        </text>
      </svg>
      <svg viewBox="0 0 40 40" className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 sm:size-16">
        <path d="M12 21 L20 38 L28 21 Z" fill="#e8b166" />
        <path d="M15 24 l10 0 M14 28 l9 0" stroke="#c98a3e" strokeWidth="1.5" />
        <circle cx="15" cy="17" r="7" fill="#f59ab5" />
        <circle cx="25" cy="17" r="7" fill="#fbe9b7" />
        <circle cx="20" cy="10" r="7.5" fill="#e3504f" />
      </svg>
    </div>
  );
}
