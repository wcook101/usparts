import Link from "next/link";
import type { Company, InventoryLocation, PartListing } from "@/generated/prisma/client";
import {
  canBuyListingNow,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  formatListingPrice,
  formatPrice,
  formatQuantity,
} from "@/lib/format";

type ListingWithCompany = PartListing & {
  company: Company;
  inventoryLocation: InventoryLocation | null;
};

type ListingCardProps = {
  listing: ListingWithCompany;
};

export function ListingCard({ listing }: ListingCardProps) {
  const buyNow = canBuyListingNow(listing.price, listing.quantity);

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold text-blue-700 group-hover:text-blue-800">
            {listing.mpn}
          </p>
          {listing.manufacturer ? (
            <p className="text-sm text-slate-500">{listing.manufacturer}</p>
          ) : null}
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {CONDITION_LABELS[listing.condition]}
        </span>
      </div>

      {listing.description ? (
        <p className="mb-4 line-clamp-2 flex-1 text-sm leading-6 text-slate-700">
          {listing.description}
        </p>
      ) : (
        <div className="mb-4 flex-1" />
      )}

      <div className="mt-auto space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {formatListingPrice(listing.price, listing.currency)}
            </p>
            <p className="text-xs text-slate-500">per unit</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">
              {formatQuantity(listing.quantity)} in stock
            </p>
            <p className="text-xs text-slate-500">
              {CATEGORY_LABELS[listing.category]}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Sold by <span className="font-medium text-slate-700">{listing.company.name}</span>
          {buyNow ? (
            <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">
              Buy now
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
