"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ListingResultsList } from "@/components/ListingResultsList";
import { BulkRfqPanel } from "@/components/BulkRfqPanel";
import { BulkSearchMatchBadge } from "@/components/BulkSearchMatchBadge";
import type { BuyerDefaults } from "@/components/BuyerContactFields";
import type { SmartSearchResult } from "@/lib/smart-search";

type SmartSearchFormProps = {
  initialQuery?: string;
  autoSearch?: boolean;
  buyerDefaults?: BuyerDefaults | null;
  enabled?: boolean;
  initialBudget?: {
    budgetUsd: number;
    spentUsd: number;
    remainingUsd: number;
    monthKey: string;
    budgetExceeded: boolean;
  } | null;
};

export function SmartSearchForm({
  initialQuery = "",
  autoSearch = false,
  buyerDefaults = null,
  enabled = true,
  initialBudget = null,
}: SmartSearchFormProps) {
  const resultsId = useId();
  const hasAutoSearched = useRef(false);
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SmartSearchResult | null>(null);
  const [budget, setBudget] = useState(initialBudget);

  async function runSearch(description: string) {
    setError(null);
    setIsSearching(true);

    try {
      const response = await fetch("/api/search/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: description }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Smart search failed");
      }

      setResults(data as SmartSearchResult);
      if (data.budget) {
        setBudget(data.budget);
      }

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

  return (
    <div className="space-y-6">
      {!enabled ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Describe-a-part search is not configured on this server yet. Use part
          number search or multi-part search instead.
        </div>
      ) : budget ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            budget.budgetExceeded
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          AI budget this month ({budget.monthKey}):{" "}
          <span className="font-medium">
            ${budget.spentUsd.toFixed(2)} / ${budget.budgetUsd.toFixed(2)}
          </span>
          {budget.budgetExceeded ? (
            <span className="mt-1 block">
              Monthly AI limit reached. Cached descriptions still work; new AI
              lookups resume next month unless the limit is raised.
            </span>
          ) : (
            <span className="ml-1 text-slate-500">
              (${budget.remainingUsd.toFixed(2)} remaining)
            </span>
          )}
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
        <div id={resultsId} className="space-y-6 scroll-mt-24">
          <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950">
            <p>
              <span className="font-semibold">You described:</span>{" "}
              &ldquo;{results.query}&rdquo;
            </p>
            <p className="mt-2">
              <span className="font-semibold">AI suggested:</span>{" "}
              <span className="font-mono text-violet-900">
                {results.suggestedMpns.join(", ")}
              </span>
              {results.cached ? (
                <span className="ml-2 text-xs text-violet-700">(cached)</span>
              ) : null}
            </p>
            <p className="mt-2 text-xs text-violet-800">
              Only parts currently in supplier inventory are shown below.
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
            {search.queriedCount === 1 ? "" : "s"} in {search.durationMs} ms
            {results.expansionMs > 0 ? ` (+${results.expansionMs} ms AI)` : ""} —{" "}
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
                    <h3 className="font-mono text-base font-semibold text-slate-900">
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
                AI suggested common parts, but none are in current inventory.
                Try a different description or use part number search.
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
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs text-slate-600"
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
