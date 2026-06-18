"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InventoryLocationText } from "@/components/InventoryLocationText";
import {
  CATEGORY_LABELS,
  formatListingPrice,
  formatQuantity,
} from "@/lib/format";

type ListingRow = {
  id: string;
  mpn: string;
  manufacturer: string;
  category: keyof typeof CATEGORY_LABELS;
  quantity: number;
  price: { toString(): string } | null;
  currency: string;
  isActive: boolean;
  updatedAt: string;
  inventoryLocation: {
    label: string | null;
    city: string;
    state: string | null;
    country: string;
  };
};

type CompanyListingsPanelProps = {
  initialListings: ListingRow[];
};

export function CompanyListingsPanel({
  initialListings,
}: CompanyListingsPanelProps) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [showInactive, setShowInactive] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleListings = showInactive
    ? listings
    : listings.filter((listing) => listing.isActive);

  async function toggleActive(listing: ListingRow) {
    const nextActive = !listing.isActive;
    const label = nextActive ? "reactivate" : "deactivate";

    if (
      !nextActive &&
      !window.confirm(`Deactivate ${listing.mpn}? It will be hidden from search.`)
    ) {
      return;
    }

    setUpdatingId(listing.id);
    setError(null);

    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? `Failed to ${label} listing`);
      }

      setListings((current) =>
        current.map((item) =>
          item.id === listing.id ? { ...item, isActive: data.isActive } : item,
        ),
      );
      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : `Failed to ${label} listing`,
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {visibleListings.length} listing
          {visibleListings.length === 1 ? "" : "s"}
          {showInactive ? " (including inactive)" : ""}
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) => setShowInactive(event.target.checked)}
            className="rounded border-slate-300"
          />
          Show inactive
        </label>
      </div>

      {visibleListings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/90 p-10 text-center text-sm text-slate-600">
          No listings yet.{" "}
          <Link href="/company/listings/new" className="text-blue-600 hover:text-blue-700">
            Add your first part
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/90">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Part</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleListings.map((listing) => (
                <tr key={listing.id} className={listing.isActive ? "" : "bg-slate-50"}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      {listing.mpn}
                    </Link>
                    <p className="text-slate-500">{listing.manufacturer}</p>
                    <p className="text-xs text-slate-400">
                      {CATEGORY_LABELS[listing.category]}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatQuantity(listing.quantity)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatListingPrice(listing.price, listing.currency)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <InventoryLocationText location={listing.inventoryLocation} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        listing.isActive
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                          : "rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700"
                      }
                    >
                      {listing.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(listing.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/company/listings/${listing.id}/edit`}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={updatingId === listing.id}
                        onClick={() => void toggleActive(listing)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {listing.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
