import Link from "next/link";
import { securityBadges } from "@/lib/trust/security-badges";

function BadgeIcon({ id }: { id: string }) {
  const className = "h-5 w-5 text-blue-600";

  switch (id) {
    case "ssl":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M12 3 20 7v5c0 4.4-3.2 8.5-8 10-4.8-1.5-8-5.6-8-10V7l8-4Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="m9 12 2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "privacy":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
          <rect
            x="5"
            y="11"
            width="14"
            height="10"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M8 11V8a4 4 0 1 1 8 0v3"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "us-network":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10Z"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "verified":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M12 2l2.4 1.2 2.6-.3 1.2 2.4 2.4 1.2-.3 2.6 1.2 2.4-2.4 1.2-.3 2.6-2.6 1.2L12 22l-2.4-1.2-2.6.3-1.2-2.4-2.4-1.2.3-2.6L3.5 14l2.4-1.2.3-2.6 2.6-1.2L12 2Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="m9 12 2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M4 7h16M4 12h10M4 17h16"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

type SecurityBadgesProps = {
  variant?: "strip" | "grid";
};

function BadgeCard({ badge }: { badge: (typeof securityBadges)[number] }) {
  const content = (
    <>
      <BadgeIcon id={badge.id} />
      <div>
        <p className="text-sm font-semibold text-slate-900">{badge.label}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-600">{badge.detail}</p>
      </div>
    </>
  );

  const className =
    "flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm transition hover:border-blue-200";

  if (badge.href) {
    return (
      <Link href={badge.href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function SecurityBadges({ variant = "strip" }: SecurityBadgesProps) {
  if (variant === "grid") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {securityBadges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-6">
      {securityBadges.map((badge) => (
        <div key={badge.id} className="flex items-center gap-2 text-left">
          <BadgeIcon id={badge.id} />
          <div>
            {badge.href ? (
              <Link
                href={badge.href}
                className="text-sm font-semibold text-slate-900 hover:text-blue-700"
              >
                {badge.label}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-slate-900">{badge.label}</p>
            )}
            <p className="hidden text-xs text-slate-500 sm:block">{badge.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
