"use client";

import { useState } from "react";
import { ListingResultsList } from "@/components/ListingResultsList";
import type { BulkSearchResult } from "@/lib/listings";
import { MAX_BULK_SEARCH_PARTS } from "@/lib/validations";

type MultiPartSearchFormProps = {
  defaultManufacturer?: string;
  defaultCategory?: string;
};

export function MultiPartSearchForm({
  defaultManufacturer = "",
  defaultCategory = "",
}: MultiPartSearchFormProps) {
  const [mpns, setMpns] = useState("");
  const [manufacturer, setManufacturer] = useState(defaultManufacturer);
  const [category, setCategory] = useState(defaultCategory);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BulkSearchResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSearching(true);

    try {
      const response = await fetch("/api/search/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mpns,
          ...(manufacturer.trim() ? { manufacturer: manufacturer.trim() } : {}),
          ...(category.trim() ? { category: category.trim() } : {}),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Bulk search failed");
      }

      setResults(data as BulkSearchResult);
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

  const foundRows = results?.rows.filter((row) => row.found) ?? [];
  const missingRows = results?.rows.filter((row) => !row.found) ?? [];

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Part numbers (one per line, or comma-separated)
          </span>
          <textarea
            value={mpns}
            onChange={(event) => setMpns(event.target.value)}
            rows={10}
            placeholder={"STM32F407VGT6\nLM358N\n1N4148\nESP32-WROOM-32"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
          <span className="block text-xs text-slate-500">
            Up to {MAX_BULK_SEARCH_PARTS.toLocaleString()} parts per search.
            Dashes and spaces are ignored when matching.
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Manufacturer filter (optional)
            </span>
            <input
              value={manufacturer}
              onChange={(event) => setManufacturer(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Category filter (optional)
            </span>
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="e.g. SEMICONDUCTOR"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSearching || !mpns.trim()}
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
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Searched {results.queriedCount.toLocaleString()} part
            {results.queriedCount === 1 ? "" : "s"} in {results.durationMs} ms —{" "}
            <span className="font-medium text-emerald-700">
              {results.foundPartCount} found
            </span>
            {results.notFoundPartCount > 0 ? (
              <>
                ,{" "}
                <span className="font-medium text-slate-900">
                  {results.notFoundPartCount} not in stock
                </span>
              </>
            ) : null}
            {results.totalListingCount > 0 ? (
              <>
                {" "}
                ({results.totalListingCount.toLocaleString()} listing
                {results.totalListingCount === 1 ? "" : "s"} across suppliers)
              </>
            ) : null}
          </div>

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
                None of the pasted part numbers are currently listed by suppliers.
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
