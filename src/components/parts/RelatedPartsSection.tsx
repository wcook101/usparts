import Link from "next/link";
import type { RelatedPart } from "@/lib/parts/part-pages";
import { getPartPagePath } from "@/lib/parts/part-path";
import { formatQuantity } from "@/lib/format";

type RelatedPartsSectionProps = {
  parts: RelatedPart[];
  currentMpn: string;
};

export function RelatedPartsSection({ parts, currentMpn }: RelatedPartsSectionProps) {
  if (parts.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold text-slate-900">Related parts & alternatives</h2>
      <p className="mt-2 text-sm text-slate-600">
        Approved alternates and package suffix variants for {currentMpn}. Different catalog
        numbers in the same series are not shown unless mapped as aliases.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {parts.map((part) => (
          <Link
            key={part.mpnNormalized}
            href={getPartPagePath(part.mpn)}
            className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono font-semibold text-blue-700">{part.mpn}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {part.manufacturer ?? "Multiple manufacturers"}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {part.reason === "alias" ? "Approved alternate" : "Package variant"}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {formatQuantity(part.listingCount)} supplier{" "}
              {part.listingCount === 1 ? "offer" : "offers"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
