type PartsBackgroundProps = {
  variant?: "hero" | "section" | "site";
  idPrefix?: string;
  fixed?: boolean;
};

const FLOATING_PARTS = [
  { label: "STM32F407VGT6", top: "8%", left: "5%", rotate: -8 },
  { label: "LM358P", top: "16%", right: "6%", rotate: 6 },
  { label: "1N4148", top: "58%", left: "3%", rotate: -4 },
  { label: "ESP32-WROOM", top: "68%", right: "4%", rotate: 5 },
  { label: "NE555P", top: "34%", left: "10%", rotate: -12 },
  { label: "74HC595", top: "44%", right: "8%", rotate: 10 },
  { label: "ATmega328P", top: "78%", left: "14%", rotate: -6 },
  { label: "BSS138", top: "24%", right: "14%", rotate: 8 },
  { label: "TPS62130", top: "52%", left: "22%", rotate: -5 },
  { label: "ISO1042", top: "86%", right: "16%", rotate: 7 },
];

export function PartsBackground({
  variant = "hero",
  idPrefix = "parts",
  fixed = false,
}: PartsBackgroundProps) {
  const gridId = `${idPrefix}-pcb-grid`;
  const tracesId = `${idPrefix}-pcb-traces`;

  const isHero = variant === "hero";
  const isSite = variant === "site";

  return (
    <div
      className={`pointer-events-none overflow-hidden ${
        fixed ? "fixed inset-0 -z-10" : "absolute inset-0"
      }`}
      aria-hidden
    >
      <div
        className={`absolute inset-0 ${
          isHero
            ? "bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-100/70"
            : isSite
              ? "bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100"
              : "bg-gradient-to-b from-sky-50/90 to-white"
        }`}
      />

      <svg
        className={`absolute inset-0 h-full w-full ${
          isHero ? "opacity-70" : isSite ? "opacity-50" : "opacity-40"
        }`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={gridId}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="1.5" fill="#2563eb" opacity="0.45" />
            <path
              d="M20 0v10M20 30v10M0 20h10M30 20h10"
              stroke="#475569"
              strokeWidth="0.85"
              opacity="0.28"
            />
          </pattern>
          <pattern
            id={tracesId}
            width="140"
            height="140"
            patternUnits="userSpaceOnUse"
          >
            <rect width="140" height="140" fill={`url(#${gridId})`} />
            <path
              d="M12 24h48v24h36M82 14v40h30M24 78h56v18h24"
              fill="none"
              stroke="#1d4ed8"
              strokeWidth="2"
              opacity="0.28"
              strokeLinecap="round"
            />
            <rect
              x="16"
              y="18"
              width="26"
              height="16"
              rx="2"
              fill="none"
              stroke="#334155"
              strokeWidth="1.5"
              opacity="0.3"
            />
            <rect
              x="70"
              y="62"
              width="32"
              height="22"
              rx="2"
              fill="none"
              stroke="#334155"
              strokeWidth="1.5"
              opacity="0.3"
            />
            <circle cx="96" cy="22" r="6" fill="none" stroke="#2563eb" opacity="0.3" />
            <path
              d="M108 98h18v-12h-18z"
              fill="none"
              stroke="#2563eb"
              strokeWidth="1.25"
              opacity="0.25"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${tracesId})`} />
      </svg>

      {isHero || isSite
        ? FLOATING_PARTS.map((part) => (
            <span
              key={`${idPrefix}-${part.label}`}
              className={`absolute font-mono font-semibold tracking-wide text-blue-700 ${
                isHero ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"
              } ${isHero ? "opacity-30" : "opacity-20"}`}
              style={{
                top: part.top,
                left: part.left,
                right: part.right,
                transform: `rotate(${part.rotate}deg)`,
              }}
            >
              {part.label}
            </span>
          ))
        : null}

      <div
        className={`absolute inset-0 ${
          isHero
            ? "bg-gradient-to-b from-white/5 via-white/20 to-white/75"
            : isSite
              ? "bg-white/55"
              : "bg-gradient-to-b from-transparent to-white/80"
        }`}
      />
    </div>
  );
}
