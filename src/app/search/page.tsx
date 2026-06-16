import Link from "next/link";
import { ListingResultsList } from "@/components/ListingResultsList";
import { RecentUploadsList } from "@/components/RecentUploadsList";
import { SearchBar } from "@/components/SearchBar";
import { CATEGORY_LABELS } from "@/lib/format";
import {
  RECENT_COMPANIES_LIMIT,
  RECENT_LISTINGS_PER_COMPANY,
  searchListings,
} from "@/lib/listings";
import { searchQuerySchema } from "@/lib/validations";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search Parts",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const parsed = searchQuerySchema.parse({
    q: typeof params.q === "string" ? params.q : undefined,
    manufacturer:
      typeof params.manufacturer === "string" ? params.manufacturer : undefined,
    category:
      typeof params.category === "string" ? params.category : undefined,
    page: typeof params.page === "string" ? params.page : undefined,
  });

  const { listings, companyGroups, total, totalCount, page, totalPages, recentOnly } =
    await searchListings(parsed);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Search components
        </h1>
        <p className="mt-2 text-slate-600">
          Find available electronic parts across registered suppliers.
        </p>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Filters
          </h2>

          <form className="mt-4 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Keyword</span>
              <input
                name="q"
                defaultValue={parsed.q ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Manufacturer
              </span>
              <input
                name="manufacturer"
                defaultValue={parsed.manufacturer ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <select
                name="category"
                defaultValue={parsed.category ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All categories</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Apply filters
            </button>
          </form>
        </aside>

        <div>
          <div className="mb-6">
            <SearchBar defaultQuery={parsed.q ?? ""} />
          </div>

          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-slate-600">
                {recentOnly ? (
                  <>
                    Showing up to {RECENT_LISTINGS_PER_COMPANY} parts each from
                    the {RECENT_COMPANIES_LIMIT} most recent suppliers
                  </>
                ) : (
                  <>
                    {totalCount && totalCount > total ? (
                      <>
                        Showing first {total} of{" "}
                        {totalCount.toLocaleString()} result
                        {totalCount === 1 ? "" : "s"}
                      </>
                    ) : (
                      <>
                        {total} result{total === 1 ? "" : "s"}
                      </>
                    )}
                    {parsed.q ? (
                      <>
                        {" "}
                        for{" "}
                        <span className="font-medium text-slate-900">
                          &ldquo;{parsed.q}&rdquo;
                        </span>
                      </>
                    ) : null}
                  </>
                )}
              </p>
              {recentOnly ? (
                <p className="text-sm text-slate-500">
                  Search by part number, manufacturer, or keyword to find
                  specific inventory.
                </p>
              ) : totalCount && totalCount > total ? (
                <p className="text-sm text-slate-500">
                  Refine your search to narrow results.
                </p>
              ) : null}
            </div>
          </div>

          {recentOnly && companyGroups && companyGroups.length > 0 ? (
            <RecentUploadsList groups={companyGroups} />
          ) : listings.length > 0 ? (
            <ListingResultsList listings={listings} />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/90 p-10 text-center backdrop-blur-sm">
              <p className="text-lg font-medium text-slate-900">No matches found</p>
              <p className="mt-2 text-sm text-slate-600">
                Try a different part number, manufacturer, or broader keyword.
              </p>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-3">
              {page > 1 ? (
                <Link
                  href={`/search?${new URLSearchParams({
                    ...(parsed.q ? { q: parsed.q } : {}),
                    ...(parsed.manufacturer
                      ? { manufacturer: parsed.manufacturer }
                      : {}),
                    ...(parsed.category ? { category: parsed.category } : {}),
                    page: String(page - 1),
                  }).toString()}`}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Previous
                </Link>
              ) : null}
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/search?${new URLSearchParams({
                    ...(parsed.q ? { q: parsed.q } : {}),
                    ...(parsed.manufacturer
                      ? { manufacturer: parsed.manufacturer }
                      : {}),
                    ...(parsed.category ? { category: parsed.category } : {}),
                    page: String(page + 1),
                  }).toString()}`}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Next
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
