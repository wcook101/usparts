"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BuyerContactFields,
  resolveBuyerPayload,
  useBuyerContact,
  type BuyerDefaults,
} from "@/components/BuyerContactFields";
import { isTurnstileEnabled, TurnstileField } from "@/components/TurnstileField";
import type { BulkSearchMatchType, BulkSearchResult, ListingWithCompany } from "@/lib/listings";
import { BulkSearchMatchBadge } from "@/components/BulkSearchMatchBadge";
import { BULK_RFQ_COOLDOWN_MINUTES, MAX_BULK_RFQ_LISTINGS } from "@/lib/validations";

type BulkRfqPanelProps = {
  results: BulkSearchResult;
  buyerDefaults?: BuyerDefaults | null;
};

type JobStatus = {
  id: string;
  status: string;
  totalListings: number;
  totalVendors: number;
  emailsSent: number;
  errorMessage: string | null;
};

function collectListings(results: BulkSearchResult): {
  listings: ListingWithCompany[];
  matchByListingId: Map<
    string,
    { matchType: BulkSearchMatchType; alternateFor?: string; matchedViaMpn?: string }
  >;
} {
  const seen = new Set<string>();
  const listings: ListingWithCompany[] = [];
  const matchByListingId = new Map<
    string,
    { matchType: BulkSearchMatchType; alternateFor?: string; matchedViaMpn?: string }
  >();

  for (const row of results.rows) {
    if (!row.found) {
      continue;
    }

    for (const listing of row.listings) {
      if (seen.has(listing.id)) {
        continue;
      }

      seen.add(listing.id);
      listings.push(listing);
      matchByListingId.set(listing.id, {
        matchType: row.matchType ?? "EXACT",
        alternateFor: row.alternateFor,
        matchedViaMpn: row.matchedViaMpn,
      });
    }
  }

  return {
    listings: listings.slice(0, MAX_BULK_RFQ_LISTINGS),
    matchByListingId,
  };
}

function defaultQuantity(listing: ListingWithCompany): number {
  return Math.max(1, listing.quantity);
}

export function BulkRfqPanel({ results, buyerDefaults = null }: BulkRfqPanelProps) {
  const { listings, matchByListingId } = useMemo(() => collectListings(results), [results]);
  const listingKey = useMemo(() => listings.map((listing) => listing.id).join(","), [listings]);

  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const turnstileRequired = isTurnstileEnabled();

  const { hasAccountProfile, contact, persistGuestContact } = useBuyerContact({
    buyerDefaults,
  });

  useEffect(() => {
    setExcludedIds(new Set());
    setQuantities(
      Object.fromEntries(listings.map((listing) => [listing.id, defaultQuantity(listing)])),
    );
  }, [listingKey, listings]);

  const selectedListings = useMemo(
    () => listings.filter((listing) => !excludedIds.has(listing.id)),
    [listings, excludedIds],
  );

  const vendorCount = useMemo(
    () => new Set(selectedListings.map((listing) => listing.companyId)).size,
    [selectedListings],
  );

  if (listings.length === 0) {
    return null;
  }

  function toggleIncluded(listingId: string, included: boolean) {
    setExcludedIds((current) => {
      const next = new Set(current);
      if (included) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      return next;
    });
  }

  function updateQuantity(listingId: string, value: string) {
    const parsed = Number.parseInt(value, 10);
    setQuantities((current) => ({
      ...current,
      [listingId]: Number.isFinite(parsed) && parsed >= 1 ? parsed : 1,
    }));
  }

  async function pollJob(jobId: string) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await fetch(`/api/quotes/bulk/${jobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not check RFQ status");
      }

      setJobStatus(data as JobStatus);

      if (data.status === "COMPLETED" || data.status === "FAILED") {
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 1500));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setJobStatus(null);

    if (selectedListings.length === 0) {
      setError("Select at least one part to include in the RFQ.");
      return;
    }

    if (turnstileRequired && !turnstileToken) {
      setError("Please complete the security check.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const buyer = resolveBuyerPayload(formData, contact, hasAccountProfile);
    persistGuestContact(buyer);

    try {
      const response = await fetch("/api/quotes/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedListings.map((listing) => ({
            listingId: listing.id,
            quantity: quantities[listing.id] ?? defaultQuantity(listing),
          })),
          ...buyer,
          notes: formData.get("notes"),
          turnstileToken: turnstileToken || undefined,
          website: formData.get("website"),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send bulk quote requests");
      }

      setJobStatus({
        id: data.jobId,
        status: data.status,
        totalListings: data.totalListings,
        totalVendors: data.totalVendors,
        emailsSent: 0,
        errorMessage: null,
      });

      await pollJob(data.jobId);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to send bulk quote requests",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (jobStatus?.status === "COMPLETED") {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        <h3 className="text-base font-semibold text-emerald-950">
          Bulk quote requests sent
        </h3>
        <p className="mt-2 leading-6">
          We queued {jobStatus.totalListings} quote request
          {jobStatus.totalListings === 1 ? "" : "s"} to{" "}
          {jobStatus.totalVendors} supplier
          {jobStatus.totalVendors === 1 ? "" : "s"}. Each supplier received one
          bundled email. You should receive a confirmation email shortly.
        </p>
      </section>
    );
  }

  if (jobStatus?.status === "FAILED") {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        <h3 className="text-base font-semibold text-red-900">
          Bulk quote requests could not be sent
        </h3>
        <p className="mt-2">{jobStatus.errorMessage ?? "Please try again later."}</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Request quotes for matched parts
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {listings.length} listing{listings.length === 1 ? "" : "s"} found across{" "}
            {new Set(listings.map((listing) => listing.companyId)).size} supplier
            {new Set(listings.map((listing) => listing.companyId)).size === 1 ? "" : "s"}.
            Uncheck lines you want to skip and adjust requested quantities before sending.
            Each supplier gets one bundled email. Another bulk RFQ can be sent every{" "}
            {BULK_RFQ_COOLDOWN_MINUTES} minutes.
          </p>
        </div>
        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Review &amp; send RFQ
          </button>
        ) : null}
      </div>

      {expanded ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 border-t border-blue-100 pt-5">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {jobStatus?.status === "SENDING" || jobStatus?.status === "PENDING" ? (
            <div className="rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm text-blue-800">
              Sending quote requests to suppliers…
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white font-search-mono">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Include</th>
                  <th className="px-3 py-3">Match</th>
                  <th className="px-3 py-3">Part number</th>
                  <th className="px-3 py-3">Manufacturer</th>
                  <th className="px-3 py-3">Supplier</th>
                  <th className="px-3 py-3 text-right">Listed qty</th>
                  <th className="px-3 py-3 text-right">Request qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((listing) => {
                  const included = !excludedIds.has(listing.id);
                  const match = matchByListingId.get(listing.id);
                  return (
                    <tr
                      key={listing.id}
                      className={included ? "bg-white" : "bg-slate-50 text-slate-400"}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={(event) =>
                            toggleIncluded(listing.id, event.target.checked)
                          }
                          aria-label={`Include ${listing.mpn}`}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <BulkSearchMatchBadge
                          matchType={match?.matchType}
                          alternateFor={match?.alternateFor}
                          matchedViaMpn={match?.matchedViaMpn}
                        />
                      </td>
                      <td className="px-3 py-3 font-search-mono text-slate-900">{listing.mpn}</td>
                      <td className="px-3 py-3">{listing.manufacturer || "—"}</td>
                      <td className="px-3 py-3">{listing.company.name}</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {listing.quantity.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <input
                          type="number"
                          min={1}
                          value={quantities[listing.id] ?? defaultQuantity(listing)}
                          disabled={!included}
                          onChange={(event) =>
                            updateQuantity(listing.id, event.target.value)
                          }
                          className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-right text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-slate-600">
            Sending {selectedListings.length} part
            {selectedListings.length === 1 ? "" : "s"} to {vendorCount} supplier
            {vendorCount === 1 ? "" : "s"}.
          </p>

          <BuyerContactFields buyerDefaults={buyerDefaults} />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Message <span className="font-normal text-slate-500">(optional)</span>
            </span>
            <textarea
              name="notes"
              rows={3}
              placeholder="Target pricing, packaging, lead time, or PO reference"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <TurnstileField onTokenChange={setTurnstileToken} />

          <button
            type="submit"
            disabled={
              isSubmitting ||
              selectedListings.length === 0 ||
              (turnstileRequired && !turnstileToken)
            }
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting
              ? "Queueing quote requests..."
              : `Send ${selectedListings.length} quote request${selectedListings.length === 1 ? "" : "s"}`}
          </button>
        </form>
      ) : null}
    </section>
  );
}
