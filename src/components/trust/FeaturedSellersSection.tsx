import Link from "next/link";
import type { FeaturedSeller } from "@/lib/listings";
import { formatQuantity } from "@/lib/format";

type FeaturedSellersSectionProps = {
  sellers: FeaturedSeller[];
};

function formatLocation(seller: FeaturedSeller): string {
  const parts = [seller.city, seller.state].filter(Boolean);
  if (parts.length > 0) {
    return `${parts.join(", ")} · ${seller.country}`;
  }
  return seller.country;
}

function sellerSearchHref(seller: FeaturedSeller): string {
  if (seller.sampleMpn) {
    return `/search?q=${encodeURIComponent(seller.sampleMpn)}`;
  }
  return `/search?q=${encodeURIComponent(seller.name)}`;
}

export function FeaturedSellersSection({ sellers }: FeaturedSellersSectionProps) {
  return (
    <section className="relative border-t border-slate-200 bg-slate-50/80">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Trusted suppliers
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              Featured sellers on USParts
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Registered US electronic component suppliers with active inventory
              listed for free BOM search and buyer discovery.
            </p>
          </div>
          <Link
            href="/company"
            className="inline-flex w-fit rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Become a featured seller
          </Link>
        </div>

        {sellers.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sellers.map((seller) => (
              <article
                key={seller.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-slate-900">
                      {seller.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">{formatLocation(seller)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Verified
                  </span>
                </div>

                <p className="mt-4 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {formatQuantity(seller.listingCount)}
                  </span>{" "}
                  active {seller.listingCount === 1 ? "listing" : "listings"} searchable by MPN
                </p>

                <Link
                  href={sellerSearchHref(seller)}
                  className="mt-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Search their inventory →
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-medium text-slate-900">Featured sellers coming soon</p>
            <p className="mt-2 text-sm text-slate-600">
              Register your company and upload inventory to appear in this section.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/company/upload"
                className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Upload inventory
              </Link>
              <Link
                href="/company"
                className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Register as supplier
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
