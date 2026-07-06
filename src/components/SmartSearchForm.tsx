"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ListingResultsList } from "@/components/ListingResultsList";
import { BulkRfqPanel } from "@/components/BulkRfqPanel";
import { BulkSearchMatchBadge } from "@/components/BulkSearchMatchBadge";
import type { BuyerDefaults } from "@/components/BuyerContactFields";
import { formatSmartSearchRefinements } from "@/lib/smart-search-query";
import type { SmartSearchResult } from "@/lib/smart-search";
import type { SmartSearchInput } from "@/lib/validations";

type SmartSearchFormProps = {
  initialQuery?: string;
  autoSearch?: boolean;
  buyerDefaults?: BuyerDefaults | null;
  enabled?: boolean;
};

const emptyRefinements = {
  supplyVoltage: "",
  channels: "",
  packageType: "",
  manufacturer: "",
  notes: "",
};

export function SmartSearchForm({
  initialQuery = "",
  autoSearch = false,
  buyerDefaults = null,
  enabled = true,
}: SmartSearchFormProps) {
  const resultsId = useId();
  const hasAutoSearched = useRef(false);
  const [query, setQuery] = useState(initialQuery);
  const [refinements, setRefinements] = useState(emptyRefinements);
  const [showRefinements, setShowRefinements] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SmartSearchResult | null>(null);

  function buildPayload(description: string): SmartSearchInput {
    const payload: SmartSearchInput = { query: description };

    if (refinements.supplyVoltage.trim()) {
      payload.supplyVoltage = refinements.supplyVoltage.trim();
    }
    if (refinements.channels.trim()) {
      payload.channels = refinements.channels.trim();
    }
    if (refinements.packageType.trim()) {
      payload.packageType = refinements.packageType.trim();
    }
    if (refinements.manufacturer.trim()) {
      payload.manufacturer = refinements.manufacturer.trim();
    }
    if (refinements.notes.trim()) {
      payload.notes = refinements.notes.trim();
    }

    return payload;
  }

  async function runSearch(description: string) {
    setError(null);
    setIsSearching(true);

    try {
      const response = await fetch("/api/search/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(description)),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Smart search failed");
      }

      setResults(data as SmartSearchResult);

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
          : "Smart search failed. Please try again.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSearch(query);
  }

  useEffect(() => {
    if (!autoSearch || hasAutoSearched.current || !initialQuery.trim() || !enabled) {
      return;
    }

    hasAutoSearched.current = true;
    void runSearch(initialQuery);
  }, [autoSearch, enabled, initialQuery]);

  const search = results?.search;
  const foundRows = search?.rows.filter((row) => row.found) ?? [];
  const missingMpns =
    search?.rows.filter((row) => !row.found).map((row) => row.input) ?? [];
  const refinementSummary = formatSmartSearchRefinements(results?.refinements);

  return (
    <div className="space-y-6">
      {!enabled ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Describe-a-part search is not configured on this server yet. Use part
          number search or multi-part search instead.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Describe the part you need
          </span>
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={4}
            placeholder={"dual op amp\nequivalent to 74HC00\nquad comparator"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
            disabled={!enabled}
          />
          <span className="block text-xs text-slate-500">
            Plain English works. AI suggests common part numbers, then we search
            your suppliers&apos; live inventory.
          </span>
        </label>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80">
          <button
            type="button"
            onClick={() => setShowRefinements((current) => !current)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-800"
          >
            Narrow it down (optional)
            <span className="text-xs font-normal text-slate-500">
              {showRefinements ? "Hide" : "Show"} voltage, package, channels
            </span>
          </button>

          {showRefinements ? (
            <div className="grid gap-4 border-t border-slate-200 px-4 py-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Supply voltage
                </span>
                <input
                  value={refinements.supplyVoltage}
                  onChange={(event) =>
                    setRefinements((current) => ({
                      ...current,
                      supplyVoltage: event.target.value,
                    }))
                  }
                  placeholder="5V single supply, ±15V"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={!enabled}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Channels</span>
                <select
                  value={refinements.channels}
                  onChange={(event) =>
                    setRefinements((current) => ({
                      ...current,
                      channels: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={!enabled}
                >
                  <option value="">Any</option>
                  <option value="single">Single</option>
                  <option value="dual">Dual</option>
                  <option value="quad">Quad</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Package</span>
                <input
                  value={refinements.packageType}
                  onChange={(event) =>
                    setRefinements((current) => ({
                      ...current,
                      packageType: event.target.value,
                    }))
                  }
                  placeholder="DIP-8, SOIC-8, SOT-23"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={!enabled}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Preferred manufacturer
                </span>
                <input
                  value={refinements.manufacturer}
                  onChange={(event) =>
                    setRefinements((current) => ({
                      ...current,
                      manufacturer: event.target.value,
                    }))
                  }
                  placeholder="Texas Instruments, Analog Devices"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={!enabled}
                />
              </label>

              <label className="block space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Other requirements
                </span>
                <input
                  value={refinements.notes}
                  onChange={(event) =>
                    setRefinements((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="rail-to-rail, low offset, industrial temp"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={!enabled}
                />
              </label>
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSearching || !query.trim() || !enabled}
          className="rounded-lg bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSearching ? "Searching with AI..." : "Find matching parts"}
        </button>
      </form>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {results && search ? (
        <div id={resultsId} className="space-y-6 scroll-mt-24 font-search-mono">
          <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950">
            <p>
              <span className="font-semibold">You described:</span>{" "}
              &ldquo;{results.query}&rdquo;
            </p>
            {refinementSummary ? (
              <p className="mt-2">
                <span className="font-semibold">Refinements:</span>{" "}
                {refinementSummary}
              </p>
            ) : null}
            <p className="mt-2">
              <span className="font-semibold">AI suggested:</span>{" "}
              <span className="font-search-mono text-violet-900">
                {results.suggestedMpns.join(", ")}
              </span>
            </p>
            <p className="mt-2 text-xs text-violet-800">
              Only parts currently in supplier inventory are shown below.
              {results.usedInventoryFallback ? (
                <>
                  {" "}
                  AI suggestions missed your stock, so we also searched inventory
                  for classic parts in this category.
                </>
              ) : null}
            </p>
          </div>

          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              search.foundPartCount > 0
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            Checked {search.queriedCount.toLocaleString()} suggested part
            {search.queriedCount === 1 ? "" : "s"} in {search.durationMs} ms —{" "}
            <span className="font-semibold">{search.foundPartCount} in stock</span>
            {search.notFoundPartCount > 0 ? (
              <>
                , {search.notFoundPartCount} suggested part
                {search.notFoundPartCount === 1 ? "" : "s"} not in stock
              </>
            ) : null}
            {search.totalListingCount > 0 ? (
              <>
                {" "}
                ({search.totalListingCount.toLocaleString()} supplier listing
                {search.totalListingCount === 1 ? "" : "s"})
              </>
            ) : null}
          </div>

          {search.foundPartCount > 0 ? (
            <BulkRfqPanel results={search} buyerDefaults={buyerDefaults} />
          ) : null}

          {foundRows.length > 0 ? (
            <div className="space-y-6">
              {foundRows.map((row) => (
                <section key={row.normalizedMpn} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-search-mono text-base font-semibold text-slate-900">
                      {row.input}
                    </h3>
                    <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-900">
                      AI suggested
                    </span>
                    <BulkSearchMatchBadge
                      matchType={row.matchType}
                      alternateFor={row.alternateFor}
                      matchedViaMpn={row.matchedViaMpn}
                    />
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
              <p className="text-lg font-medium text-slate-900">
                No supplier stock for these suggestions
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {results.usedInventoryFallback
                  ? "We searched common part families in inventory but found no matches. Try different refinements or use part number search."
                  : "AI suggested common parts, but none are in current inventory. Try different refinements or use part number search."}
              </p>
            </div>
          )}

          {missingMpns.length > 0 ? (
            <section className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Suggested but not in stock ({missingMpns.length})
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {missingMpns.map((mpn) => (
                  <li
                    key={mpn}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-search-mono text-xs text-slate-600"
                  >
                    {mpn}
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
