"use client";

import { useMemo, useState } from "react";
import {
  BuyerContactFields,
  resolveBuyerPayload,
  useBuyerContact,
  type BuyerDefaults,
} from "@/components/BuyerContactFields";
import { isTurnstileEnabled, TurnstileField } from "@/components/TurnstileField";
import type { BulkSearchResult, ListingWithCompany } from "@/lib/listings";
import { MAX_BULK_RFQ_LISTINGS } from "@/lib/validations";

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

function collectListings(results: BulkSearchResult): ListingWithCompany[] {
  const seen = new Set<string>();
  const listings: ListingWithCompany[] = [];

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
    }
  }

  return listings.slice(0, MAX_BULK_RFQ_LISTINGS);
}

export function BulkRfqPanel({ results, buyerDefaults = null }: BulkRfqPanelProps) {
  const listings = useMemo(() => collectListings(results), [results]);
  const vendorCount = useMemo(
    () => new Set(listings.map((listing) => listing.companyId)).size,
    [listings],
  );

  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRequired = isTurnstileEnabled();

  const { hasAccountProfile, contact, persistGuestContact } = useBuyerContact({
    buyerDefaults,
  });

  if (listings.length === 0) {
    return null;
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
          listingIds: listings.map((listing) => listing.id),
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
            Request quotes for all matches
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Send RFQs for {listings.length} listing
            {listings.length === 1 ? "" : "s"} across {vendorCount} supplier
            {vendorCount === 1 ? "" : "s"}. Each supplier gets one bundled email
            — not dozens of separate messages.
          </p>
        </div>
        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Send bulk RFQ
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
            disabled={isSubmitting || (turnstileRequired && !turnstileToken)}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting
              ? "Queueing quote requests..."
              : `Send ${listings.length} quote request${listings.length === 1 ? "" : "s"}`}
          </button>
        </form>
      ) : null}
    </section>
  );
}
