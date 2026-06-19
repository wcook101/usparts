import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingResultsList } from "@/components/ListingResultsList";
import { MultiPartSearchForm } from "@/components/MultiPartSearchForm";
import { MultiPartSearchLimits } from "@/components/MultiPartSearchLimits";
import { RecentUploadsList } from "@/components/RecentUploadsList";
import { SearchBar } from "@/components/SearchBar";
import { SmartSearchForm } from "@/components/SmartSearchForm";
import { getBuyerDefaults, getSessionUser } from "@/lib/auth";
import { CATEGORY_LABELS } from "@/lib/format";
import {
  RECENT_COMPANIES_LIMIT,
  RECENT_LISTINGS_PER_COMPANY,
  searchListings,
} from "@/lib/listings";
import { looksLikeMultiPartQuery } from "@/lib/mpn-normalize";
import { isSmartSearchEnabled } from "@/lib/smart-search";
import { searchQuerySchema } from "@/lib/validations";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type SearchMode = "single" | "bulk" | "smart";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search Parts | Part Find System",
  description:
    "Use the USParts part find system to search manufacturer part numbers, manufacturers, and categories across US supplier inventory.",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const modeParam = typeof params.mode === "string" ? params.mode : "single";
  const mode: SearchMode =
    modeParam === "bulk" ? "bulk" : modeParam === "smart" ? "smart" : "single";
  const isBulkMode = mode === "bulk";
  const isSmartMode = mode === "smart";
  const bulkMpns =
    typeof params.mpns === "string"
      ? params.mpns
      : typeof params.q === "string" && isBulkMode
        ? params.q
        : "";
  const smartQuery =
    typeof params.describe === "string"
      ? params.describe
      : typeof params.q === "string" && isSmartMode
        ? params.q
        : "";

  const parsed = searchQuerySchema.parse({
    q: typeof params.q === "string" ? params.q : undefined,
    manufacturer:
      typeof params.manufacturer === "string" ? params.manufacturer : undefined,
    category:
      typeof params.category === "string" ? params.category : undefined,
    page: typeof params.page === "string" ? params.page : undefined,
  });

  if (!isBulkMode && !isSmartMode && parsed.q && looksLikeMultiPartQuery(parsed.q)) {
    redirect(`/search?mode=bulk&mpns=${encodeURIComponent(parsed.q)}`);
  }

  const user = await getSessionUser();
  const smartSearchEnabled = isSmartSearchEnabled();

  const searchResults =
    isBulkMode || isSmartMode
      ? {
          listings: [],
          companyGroups: undefined,
          total: 0,
          totalCount: 0,
          page: 1,
          totalPages: 1,
          recentOnly: false,
        }
      : await searchListings(parsed);

  const {
    listings,
    companyGroups,
    total,
    totalCount,
    page,
    totalPages,
    recentOnly,
  } = searchResults;

  const buyerDefaults =
    isBulkMode || isSmartMode ? getBuyerDefaults(user) : null;

  function buildSearchHref(nextMode: SearchMode) {
    if (nextMode === "bulk") {
      const query = new URLSearchParams({ mode: "bulk" });
      if (bulkMpns.trim()) {
        query.set("mpns", bulkMpns);
      }
      return `/search?${query.toString()}`;
    }

    if (nextMode === "smart") {
      const query = new URLSearchParams({ mode: "smart" });
      if (smartQuery.trim()) {
        query.set("describe", smartQuery);
      }
      return `/search?${query.toString()}`;
    }

    const query = new URLSearchParams();
    if (parsed.q) {
      query.set("q", parsed.q);
    }
    if (parsed.manufacturer) {
      query.set("manufacturer", parsed.manufacturer);
    }
    if (parsed.category) {
      query.set("category", parsed.category);
    }
    const value = query.toString();
    return value ? `/search?${value}` : "/search";
  }

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

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href={buildSearchHref("single")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "single"
              ? "bg-blue-600 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Part number
        </Link>
        <Link
          href={buildSearchHref("bulk")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            isBulkMode
              ? "bg-blue-600 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Multi-part / BOM
        </Link>
        <Link
          href={buildSearchHref("smart")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            isSmartMode
              ? "bg-violet-600 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Describe a part
        </Link>
      </div>

      {isSmartMode ? (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              AI-assisted lookup
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Describe what you need in plain English. AI suggests common part
              numbers, then we search live supplier inventory.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>dual op amp</li>
              <li>quad comparator</li>
              <li>equivalent to 74HC00</li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Suggestions are cached to keep costs low. You only see parts
              actually in stock.
            </p>
          </aside>

          <SmartSearchForm
            initialQuery={smartQuery}
            autoSearch={Boolean(smartQuery.trim())}
            buyerDefaults={buyerDefaults}
            enabled={smartSearchEnabled}
          />
        </div>
      ) : isBulkMode ? (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Multi-part lookup
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Paste a BOM or part list and search up to 500 MPNs in one indexed
              database query — the same workflow legacy surplus search tools use.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>One line with spaces works: lm358n 1N4148</li>
              <li>Or one part number per line</li>
              <li>Base numbers match variants (LM358 → LM358N)</li>
              <li>Package suffixes match siblings (NE555H → NE555N, NE555P)</li>
            </ul>
            <MultiPartSearchLimits />
          </aside>

          <MultiPartSearchForm
            initialMpns={bulkMpns}
            autoSearch={Boolean(bulkMpns.trim())}
            buyerDefaults={buyerDefaults}
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
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

            <p className="mt-4 text-sm text-slate-600">
              Not sure of the part number?{" "}
              <Link href="/search?mode=smart" className="font-medium text-violet-700 hover:text-violet-800">
                Try describe-a-part search
              </Link>
              .
            </p>
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
                <p className="mt-3 text-sm text-slate-600">
                  <Link
                    href="/search?mode=smart"
                    className="font-medium text-violet-700 hover:text-violet-800"
                  >
                    Describe the part instead
                  </Link>
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
      )}
    </div>
  );
}
