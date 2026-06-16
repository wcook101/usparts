import Link from "next/link";
import type { ListingWithCompany } from "@/lib/listings";
import {
  CONDITION_LABELS,
  formatListingPrice,
  formatQuantity,
} from "@/lib/format";

type ListingResultsListProps = {
  listings: ListingWithCompany[];
};

export function ListingResultsList({ listings }: ListingResultsListProps) {
  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 sm:px-5">Part number</th>
              <th className="px-4 py-3 sm:px-5">Manufacturer</th>
              <th className="px-4 py-3 sm:px-5">Supplier</th>
              <th className="px-4 py-3 sm:px-5">Qty</th>
              <th className="px-4 py-3 sm:px-5">Price</th>
              <th className="px-4 py-3 sm:px-5">Condition</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr
                key={listing.id}
                className="border-b border-slate-50 transition hover:bg-blue-50/60"
              >
                <td className="px-4 py-3 sm:px-5">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="font-mono font-medium text-blue-700 hover:text-blue-800"
                  >
                    {listing.mpn}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600 sm:px-5">
                  {listing.manufacturer || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600 sm:px-5">
                  {listing.company.name}
                </td>
                <td className="px-4 py-3 text-slate-900 sm:px-5">
                  {formatQuantity(listing.quantity)}
                </td>
                <td className="px-4 py-3 text-slate-900 sm:px-5">
                  {formatListingPrice(listing.price, listing.currency)}
                </td>
                <td className="px-4 py-3 text-slate-600 sm:px-5">
                  {CONDITION_LABELS[listing.condition]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
