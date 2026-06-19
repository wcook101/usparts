"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ListingResultsList } from "@/components/ListingResultsList";
import { BulkRfqPanel } from "@/components/BulkRfqPanel";
import { GuestSearchLimitBanner } from "@/components/GuestSearchLimitBanner";
import { MultiPartSearchLimits } from "@/components/MultiPartSearchLimits";
import type { BulkSearchResult } from "@/lib/listings";
import type { BuyerDefaults } from "@/components/BuyerContactFields";
import type { GuestSearchAccess } from "@/lib/guest-search-limit";

type MultiPartSearchFormProps = {
  initialMpns?: string;
  autoSearch?: boolean;
  buyerDefaults?: BuyerDefaults | null;
  guestSearch: GuestSearchAccess;
};

type BulkSearchApiResponse = BulkSearchResult & {
  guestSearch?: GuestSearchAccess;
};

export function MultiPartSearchForm({
  initialMpns = "",
  autoSearch = false,
  buyerDefaults = null,
  guestSearch,
}: MultiPartSearchFormProps) {
  const resultsId = useId();
  const hasAutoSearched = useRef(false);
  const [mpns, setMpns] = useState(initialMpns);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BulkSearchResult | null>(null);
  const [guestAccess, setGuestAccess] = useState(guestSearch);

  async function runSearch(partList: string) {
    setError(null);
    setIsSearching(true);

    try {
      const response = await fetch("/api/search/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mpns: partList }),
      });

      const data = (await response.json()) as BulkSearchApiResponse & {
        error?: string;
        signupUrl?: string;
      };

      if (!response.ok) {
        if (response.status === 403 && data.guestSearch) {
          setGuestAccess(data.guestSearch);
        }
        throw new Error(data.error ?? "Bulk search failed");
      }

      if (data.guestSearch) {
        setGuestAccess(data.guestSearch);
      }

      const { guestSearch: _guestSearch, ...searchResults } = data;
      setResults(searchResults);

      requestAnimationFrame(() => {
        document.getElementById(resultsId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (submitError) {
      setResults(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Bulk search failed. Please try again.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSearch(mpns);
  }

  useEffect(() => {
    if (!autoSearch || hasAutoSearched.current || !initialMpns.trim()) {
      return;
    }

    hasAutoSearched.current = true;
    void runSearch(initialMpns);
  }, [autoSearch, initialMpns]);

  const foundRows = results?.rows.filter((row) => row.found) ?? [];
  const missingRows = results?.rows.filter((row) => !row.found) ?? [];

  return (
    <div className="space-y-6">
      <GuestSearchLimitBanner access={guestAccess} />
      <MultiPartSearchLimits compact />

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Part numbers (one per line, spaces, or commas)
          </span>
          <textarea
            value={mpns}
            onChange={(event) => setMpns(event.target.value)}
            rows={10}
            disabled={!guestAccess.allowed}
            placeholder={"LM358N 1N4148\nor one part per line"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            required
          />
          <span className="block text-xs text-slate-500">
            Paste part numbers on one line, separated by spaces, or one per line.
            Case does not matter.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSearching || !mpns.trim() || !guestAccess.allowed}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSearching ? "Searching inventory..." : "Search all parts"}
        </button>
      </form>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {results ? (
        <div id={resultsId} className="space-y-6 scroll-mt-24">
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              results.foundPartCount > 0
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            Searched {results.queriedCount.toLocaleString()} part
            {results.queriedCount === 1 ? "" : "s"} in {results.durationMs} ms —{" "}
            <span className="font-semibold">
              {results.foundPartCount} found
            </span>
            {results.notFoundPartCount > 0 ? (
              <>
                , {results.notFoundPartCount} not in stock
              </>
            ) : null}
            {results.totalListingCount > 0 ? (
              <>
                {" "}
                ({results.totalListingCount.toLocaleString()} supplier listing
                {results.totalListingCount === 1 ? "" : "s"})
              </>
            ) : null}
          </div>

          {results.foundPartCount > 0 ? (
            <BulkRfqPanel results={results} buyerDefaults={buyerDefaults} />
          ) : null}

          {foundRows.length > 0 ? (
            <div className="space-y-6">
              {foundRows.map((row) => (
                <section key={row.normalizedMpn} className="space-y-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="font-mono text-base font-semibold text-slate-900">
                      {row.input}
                    </h3>
                    <span className="text-sm text-emerald-700">
                      {row.listings.length} listing
                      {row.listings.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <ListingResultsList listings={row.listings} />
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/90 p-10 text-center backdrop-blur-sm">
              <p className="text-lg font-medium text-slate-900">No matches found</p>
              <p className="mt-2 text-sm text-slate-600">
                None of the pasted part numbers match current supplier inventory.
                Try a base part number (LM358 instead of LM358N).
              </p>
            </div>
          )}

          {missingRows.length > 0 ? (
            <section className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Not in stock ({missingRows.length})
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {missingRows.map((row) => (
                  <li
                    key={row.normalizedMpn}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs text-slate-600"
                  >
                    {row.input}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
