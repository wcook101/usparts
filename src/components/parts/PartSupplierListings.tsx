import Link from "next/link";
import type { ListingWithCompany } from "@/lib/listings";
import { InventoryLocationText } from "@/components/InventoryLocationText";
import {
  CONDITION_LABELS,
  formatListingPrice,
  formatQuantity,
} from "@/lib/format";

type PartSupplierListingsProps = {
  listings: ListingWithCompany[];
  mpn: string;
};

export function PartSupplierListings({ listings, mpn }: PartSupplierListingsProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <h2 className="text-xl font-semibold text-slate-900">Current stock & pricing</h2>
        <p className="mt-1 text-sm text-slate-600">
          Compare {listings.length} active supplier{" "}
          {listings.length === 1 ? "offer" : "offers"} for {mpn}.
        </p>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {listings.map((listing) => (
          <article key={listing.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{listing.company.name}</p>
                <p className="mt-1 text-sm text-slate-600">
                  <InventoryLocationText location={listing.inventoryLocation} />
                </p>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {formatListingPrice(listing.price, listing.currency)}
              </p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-slate-500">Qty</dt>
                <dd className="font-medium text-slate-900">
                  {formatQuantity(listing.quantity)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Condition</dt>
                <dd>{CONDITION_LABELS[listing.condition]}</dd>
              </div>
            </dl>
            <Link
              href={`/listings/${listing.id}`}
              className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Request quote
            </Link>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Supplier</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Qty</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Condition</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-slate-50">
                <td className="px-5 py-4 font-medium text-slate-900">
                  {listing.company.name}
                </td>
                <td className="px-5 py-4 text-slate-600">
                  <InventoryLocationText location={listing.inventoryLocation} />
                </td>
                <td className="px-5 py-4 text-slate-900">
                  {formatQuantity(listing.quantity)}
                </td>
                <td className="px-5 py-4 font-medium text-slate-900">
                  {formatListingPrice(listing.price, listing.currency)}
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {CONDITION_LABELS[listing.condition]}
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Request quote
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
