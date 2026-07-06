import Link from "next/link";
import type { ListingWithCompany } from "@/lib/listings";
import { InventoryLocationText } from "@/components/InventoryLocationText";
import { DatasheetLookupButton } from "@/components/parts/DatasheetLookupButton";
import {
  CONDITION_LABELS,
  formatListingPrice,
  formatQuantity,
} from "@/lib/format";
import { getPartPagePath } from "@/lib/parts/part-path";

type ListingResultsListProps = {
  listings: ListingWithCompany[];
};

function ListingMobileCard({ listing }: { listing: ListingWithCompany }) {
  return (
    <article className="px-4 py-4">
      <Link
        href={getPartPagePath(listing.mpn)}
        className="font-search-mono text-base font-semibold text-blue-700 hover:text-blue-800"
      >
        {listing.mpn}
      </Link>
      <dl className="mt-3 grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-2 text-sm">
        <dt className="text-slate-500">Manufacturer</dt>
        <dd className="text-slate-800">{listing.manufacturer || "—"}</dd>
        <dt className="text-slate-500">Supplier</dt>
        <dd className="text-slate-800">{listing.company.name}</dd>
        <dt className="text-slate-500">Location</dt>
        <dd className="text-slate-800">
          <InventoryLocationText location={listing.inventoryLocation} />
        </dd>
        <dt className="text-slate-500">Qty</dt>
        <dd className="font-medium text-slate-900">
          {formatQuantity(listing.quantity)}
        </dd>
        <dt className="text-slate-500">Price</dt>
        <dd className="font-medium text-slate-900">
          {formatListingPrice(listing.price, listing.currency)}
        </dd>
        <dt className="text-slate-500">Condition</dt>
        <dd className="text-slate-800">{CONDITION_LABELS[listing.condition]}</dd>
        <dt className="text-slate-500">Datasheet</dt>
        <dd>
          <DatasheetLookupButton
            mpn={listing.mpn}
            mpnNormalized={listing.mpnNormalized}
            manufacturer={listing.manufacturer}
            cachedUrl={listing.datasheetUrl}
          />
        </dd>
      </dl>
    </article>
  );
}

export function ListingResultsList({ listings }: ListingResultsListProps) {
  if (listings.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 font-search-mono shadow-sm shadow-slate-200/60 backdrop-blur-sm">
      <div className="divide-y divide-slate-100 md:hidden">
        {listings.map((listing) => (
          <ListingMobileCard key={listing.id} listing={listing} />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 lg:px-5">Part number</th>
              <th className="px-4 py-3 lg:px-5">Manufacturer</th>
              <th className="px-4 py-3 lg:px-5">Supplier</th>
              <th className="px-4 py-3 lg:px-5">Location</th>
              <th className="px-4 py-3 lg:px-5">Qty</th>
              <th className="px-4 py-3 lg:px-5">Price</th>
              <th className="px-4 py-3 lg:px-5">Condition</th>
              <th className="px-4 py-3 lg:px-5">Datasheet</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr
                key={listing.id}
                className="border-b border-slate-50 transition hover:bg-blue-50/60"
              >
                <td className="px-4 py-3 lg:px-5">
                  <Link
                    href={getPartPagePath(listing.mpn)}
                    className="font-search-mono font-medium text-blue-700 hover:text-blue-800"
                  >
                    {listing.mpn}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600 lg:px-5">
                  {listing.manufacturer || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600 lg:px-5">
                  {listing.company.name}
                </td>
                <td className="px-4 py-3 lg:px-5">
                  <InventoryLocationText location={listing.inventoryLocation} />
                </td>
                <td className="px-4 py-3 text-slate-900 lg:px-5">
                  {formatQuantity(listing.quantity)}
                </td>
                <td className="px-4 py-3 text-slate-900 lg:px-5">
                  {formatListingPrice(listing.price, listing.currency)}
                </td>
                <td className="px-4 py-3 text-slate-600 lg:px-5">
                  {CONDITION_LABELS[listing.condition]}
                </td>
                <td className="px-4 py-3 lg:px-5">
                  <DatasheetLookupButton
                    mpn={listing.mpn}
                    mpnNormalized={listing.mpnNormalized}
                    manufacturer={listing.manufacturer}
                    cachedUrl={listing.datasheetUrl}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
