import Link from "next/link";
import type { CompanyRecentListings } from "@/lib/listings";
import { InventoryLocationText } from "@/components/InventoryLocationText";
import {
  CONDITION_LABELS,
  formatListingPrice,
  formatQuantity,
} from "@/lib/format";
import { getPartPagePath } from "@/lib/parts/part-path";

type RecentUploadsListProps = {
  groups: CompanyRecentListings[];
  useSearchMono?: boolean;
};

function formatUploadedAt(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function RecentUploadsList({
  groups,
  useSearchMono = false,
}: RecentUploadsListProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-8 ${useSearchMono ? "font-search-mono" : ""}`}>
      {groups.map((group) => (
        <section
          key={group.company.id}
          className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50/90 to-slate-50 px-4 py-3 sm:px-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {group.company.name}
              </h3>
              <p className="text-xs text-slate-500">
                Last upload {formatUploadedAt(group.lastUploadedAt)}
              </p>
            </div>
            <Link
              href={`/search?manufacturer=${encodeURIComponent(group.company.name)}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Search this supplier
            </Link>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {group.listings.map((listing) => (
              <article key={listing.id} className="px-4 py-4">
                <Link
                  href={getPartPagePath(listing.mpn)}
                  className="font-search-mono text-base font-semibold text-blue-700 hover:text-blue-800"
                >
                  {listing.mpn}
                </Link>
                <dl className="mt-3 grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-2 text-sm">
                  <dt className="text-slate-500">Manufacturer</dt>
                  <dd className="text-slate-800">{listing.manufacturer || "—"}</dd>
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
                  <dd className="text-slate-800">
                    {CONDITION_LABELS[listing.condition]}
                  </dd>
                </dl>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 sm:px-5">Part number</th>
                  <th className="px-4 py-3 sm:px-5">Manufacturer</th>
                  <th className="px-4 py-3 sm:px-5">Location</th>
                  <th className="px-4 py-3 sm:px-5">Qty</th>
                  <th className="px-4 py-3 sm:px-5">Price</th>
                  <th className="px-4 py-3 sm:px-5">Condition</th>
                </tr>
              </thead>
              <tbody>
                {group.listings.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-b border-slate-50 transition hover:bg-blue-50/60"
                  >
                    <td className="px-4 py-3 sm:px-5">
                      <Link
                        href={getPartPagePath(listing.mpn)}
                        className="font-search-mono font-medium text-blue-700 hover:text-blue-800"
                      >
                        {listing.mpn}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 sm:px-5">
                      {listing.manufacturer || "—"}
                    </td>
                    <td className="px-4 py-3 sm:px-5">
                      <InventoryLocationText location={listing.inventoryLocation} />
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
      ))}
    </div>
  );
}
