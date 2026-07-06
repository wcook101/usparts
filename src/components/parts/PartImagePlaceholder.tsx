import type { PartCategory } from "@/generated/prisma/client";
import { CATEGORY_LABELS } from "@/lib/format";

type PartImagePlaceholderProps = {
  mpn: string;
  category: PartCategory | null;
  manufacturer: string | null;
};

export function PartImagePlaceholder({
  mpn,
  category,
  manufacturer,
}: PartImagePlaceholderProps) {
  const label = category ? CATEGORY_LABELS[category] : "Electronic component";

  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-8 text-center shadow-sm">
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
        <svg aria-hidden="true" viewBox="0 0 64 64" className="h-14 w-14" fill="none">
          <rect x="12" y="12" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="3" />
          <path
            d="M20 24h24M20 32h24M20 40h16"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="48" cy="16" r="4" fill="currentColor" />
          <circle cx="16" cy="48" r="4" fill="currentColor" />
        </svg>
      </div>
      <p className="mt-6 font-mono text-lg font-bold text-slate-900">{mpn}</p>
      <p className="mt-2 text-sm text-slate-600">{label}</p>
      {manufacturer ? (
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
          {manufacturer}
        </p>
      ) : null}
      <p className="mt-4 text-xs text-slate-400">Supplier photo available on listing pages</p>
    </div>
  );
}
