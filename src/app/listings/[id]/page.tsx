import Link from "next/link";
import { notFound } from "next/navigation";
import { InventoryLocationText } from "@/components/InventoryLocationText";
import { DatasheetSection } from "@/components/parts/DatasheetSection";
import { PlaceOrderForm } from "@/components/PlaceOrderForm";
import { RequestQuoteForm } from "@/components/RequestQuoteForm";
import {
  canBuyListingNow,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  formatListingPrice,
  formatPrice,
  formatQuantity,
} from "@/lib/format";
import { getBuyerDefaults, getSessionUser } from "@/lib/auth";
import { getListingById } from "@/lib/listings";
import { getPartPagePath } from "@/lib/parts/part-path";
import { collectDatasheetUrls } from "@/lib/datasheet";
import { listingMetadata, pageMetadata } from "@/lib/seo/page-metadata";

type ListingPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ListingPageProps) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    return pageMetadata.listingNotFound;
  }

  const categoryLabel = listing.category
    ? CATEGORY_LABELS[listing.category]
    : null;
  const conditionLabel = listing.condition
    ? CONDITION_LABELS[listing.condition]
    : null;
  const stockLabel = formatQuantity(listing.quantity);
  const priceLabel = formatListingPrice(listing.price, listing.currency);

  return listingMetadata({
    mpn: listing.mpn,
    manufacturer: listing.manufacturer,
    description: listing.description,
    categoryLabel,
    conditionLabel,
    stockLabel,
    priceLabel,
  });
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const [listing, user] = await Promise.all([
    getListingById(id),
    getSessionUser(),
  ]);

  if (!listing || !listing.isActive) {
    notFound();
  }

  const buyerDefaults = getBuyerDefaults(user);

  const buyNow = canBuyListingNow(listing.price, listing.quantity);
  const inStock = listing.quantity > 0;
  const listingPrice = listing.price;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/search"
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Back to search
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-sm font-semibold text-blue-700">
                {listing.mpn}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {listing.manufacturer || listing.mpn}
              </h1>
              <Link
                href={getPartPagePath(listing.mpn)}
                className="mt-2 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View all offers for {listing.mpn} →
              </Link>
              <p className="mt-3 text-sm text-slate-500">
                {CATEGORY_LABELS[listing.category]} ·{" "}
                {CONDITION_LABELS[listing.condition]}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {formatListingPrice(listingPrice, listing.currency)}
              </p>
              <p className="text-sm text-slate-500">
                {buyNow ? "per unit" : "contact supplier for pricing"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Available
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {formatQuantity(listing.quantity)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Date code
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {listing.dateCode ?? "Not specified"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Lead time
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {listing.leadTimeDays != null
                  ? `${listing.leadTimeDays} days`
                  : "Contact supplier"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Location
              </p>
              <p className="mt-1">
                <InventoryLocationText
                  location={listing.inventoryLocation}
                  emphasize
                />
              </p>
            </div>
          </div>

          {listing.description ? (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-slate-900">Description</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {listing.description}
              </p>
            </div>
          ) : null}

          <DatasheetSection
            mpn={listing.mpn}
            manufacturer={listing.manufacturer}
            datasheetUrls={collectDatasheetUrls([listing])}
            quoteHref={`#quote`}
            supplierCount={1}
            variant="listing"
          />
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Supplier</h2>
            <p className="mt-3 text-xl font-medium text-slate-900">
              {listing.company.name}
            </p>
            {listing.company.description ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {listing.company.description}
              </p>
            ) : null}

            <div className="mt-6 space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-800">Email:</span>{" "}
                <a
                  href={`mailto:${listing.company.email}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {listing.company.email}
                </a>
              </p>
              {listing.company.phone ? (
                <p>
                  <span className="font-medium text-slate-800">Phone:</span>{" "}
                  {listing.company.phone}
                </p>
              ) : null}
              {[listing.company.city, listing.company.state, listing.company.country]
                .filter(Boolean)
                .join(", ") ? (
                <p>
                  <span className="font-medium text-slate-800">Headquarters:</span>{" "}
                  {[listing.company.city, listing.company.state, listing.company.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              ) : null}
            </div>

            {listing.company.website ? (
              <a
                href={listing.company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Visit supplier website
              </a>
            ) : null}
          </section>

          {buyNow ? (
            <section id="quote" className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Buy now
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This part is listed at{" "}
                <span className="font-medium text-slate-900">
                  {formatListingPrice(listingPrice, listing.currency)}
                </span>{" "}
                per unit. Place your order immediately and the supplier will
                confirm fulfillment details.
              </p>
              <div className="mt-5">
                <PlaceOrderForm
                  listingId={listing.id}
                  mpn={listing.mpn}
                  manufacturer={listing.manufacturer}
                  unitPrice={listingPrice?.toString() ?? "0"}
                  currency={listing.currency}
                  availableQuantity={listing.quantity}
                  buyerDefaults={buyerDefaults}
                />
              </div>
            </section>
          ) : inStock ? (
            <section id="quote" className="rounded-2xl border border-amber-100 bg-amber-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Request a quote
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This part is in stock but priced on request. Submit an RFQ and
                the supplier will respond by email.
              </p>
              <div className="mt-5">
                <RequestQuoteForm
                  listingId={listing.id}
                  mpn={listing.mpn}
                  manufacturer={listing.manufacturer}
                  availableQuantity={listing.quantity}
                  buyerDefaults={buyerDefaults}
                />
              </div>
            </section>
          ) : (
            <section id="quote" className="rounded-2xl border border-amber-100 bg-amber-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Out of stock
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This listing is not currently available for immediate purchase.
                Request a quote for pricing and availability.
              </p>
              <div className="mt-5">
                <RequestQuoteForm
                  listingId={listing.id}
                  mpn={listing.mpn}
                  manufacturer={listing.manufacturer}
                  availableQuantity={0}
                  buyerDefaults={buyerDefaults}
                  submitLabel="Request availability"
                />
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Need a custom quote?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              For alternate quantities, packaging, or terms, send a quote request
              to the supplier.
            </p>
            <div className="mt-5">
              <RequestQuoteForm
                listingId={listing.id}
                mpn={listing.mpn}
                manufacturer={listing.manufacturer}
                availableQuantity={listing.quantity}
                buyerDefaults={buyerDefaults}
                variant="secondary"
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
