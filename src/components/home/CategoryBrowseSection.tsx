import Link from "next/link";
import { browseCategories } from "@/lib/home/categories";
import type { CategoryListingCount } from "@/lib/marketplace-stats";
import { CATEGORY_LABELS, formatQuantity } from "@/lib/format";

type CategoryBrowseSectionProps = {
  counts: CategoryListingCount[];
};

function categoryIcon(category: string) {
  const className = "h-6 w-6 text-blue-600";

  switch (category) {
    case "INTEGRATED_CIRCUIT":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "SEMICONDUCTOR":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    default:
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M12 3 20 9v6l-8 6-8-6V9l8-6Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function CategoryBrowseSection({ counts }: CategoryBrowseSectionProps) {
  const countMap = new Map(counts.map((item) => [item.category, item.count]));

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Browse by category
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
              Find semiconductors, ICs, passives, and more
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Search active US supplier inventory by component type — from
              integrated circuits and memory to connectors and power parts.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex w-fit rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Search all parts
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {browseCategories.map((item) => {
            const count = countMap.get(item.category) ?? 0;

            return (
              <Link
                key={item.category}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 transition group-hover:bg-blue-100">
                  {categoryIcon(item.category)}
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {count > 0
                    ? `${formatQuantity(count)} in stock`
                    : "Search category"}
                </p>
              </Link>
            );
          })}
        </div>

        {counts.length > 0 ? (
          <p className="mt-6 text-sm text-slate-500">
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
