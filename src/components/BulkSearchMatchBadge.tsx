import type { BulkSearchMatchType } from "@/lib/listings";

type BulkSearchMatchBadgeProps = {
  matchType?: BulkSearchMatchType;
  alternateFor?: string;
  matchedViaMpn?: string;
};

export function BulkSearchMatchBadge({
  matchType = "EXACT",
  alternateFor,
  matchedViaMpn,
}: BulkSearchMatchBadgeProps) {
  if (matchType === "ALTERNATE") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
        Alternate match
        {alternateFor ? (
          <>
            {" "}
            for <span className="font-search-mono">{alternateFor}</span>
          </>
        ) : null}
        {matchedViaMpn ? (
          <span className="ml-1 font-search-mono text-amber-800">→ {matchedViaMpn}</span>
        ) : null}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
      Exact match
    </span>
  );
}
