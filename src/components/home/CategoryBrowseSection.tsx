import Link from "next/link";
import { browseCategories } from "@/lib/home/categories";
import type { CategoryListingCount } from "@/lib/marketplace-stats";
import { CATEGORY_LABELS, formatQuantity } from "@/lib/format";

type CategoryBrowseSectionProps = {
  counts: CategoryListingCount[];
};

export function CategoryBrowseSection({ counts }: CategoryBrowseSectionProps) {
  const countMap = new Map(counts.map((item) => [item.category, item.count]));

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#0a1628] sm:text-2xl">
              Browse by category
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Active US supplier inventory by component type.
            </p>
          </div>
          <Link
            href="/search"
            className="text-sm font-semibold text-[#c41230] hover:underline"
          >
            Search all parts →
          </Link>
        </div>

        <div className="mt-6 overflow-x-auto border border-slate-200">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Listings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {browseCategories.map((item) => {
                const count = countMap.get(item.category) ?? 0;
                return (
                  <tr key={item.category} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <Link
                        href={item.href}
                        className="font-semibold text-[#0a1628] hover:text-[#c41230]"
                      >
                        {item.label}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.description}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-700">
                      {count > 0 ? formatQuantity(count) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {counts.length > 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Top category:{" "}
            <span className="font-medium text-slate-700">
              {CATEGORY_LABELS[counts[0]!.category]}
            </span>{" "}
            with {formatQuantity(counts[0]!.count)} active listings.
          </p>
        ) : null}
      </div>
    </section>
  );
}
