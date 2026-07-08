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
    <section className="border-b border-slate-200 bg-slate-50/50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#0a1628] sm:text-2xl">
              Featured suppliers
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Registered US suppliers with active inventory.
            </p>
          </div>
          <Link
            href="/company"
            className="text-sm font-semibold text-[#c41230] hover:underline"
          >
            Become a supplier →
          </Link>
        </div>

        {sellers.length > 0 ? (
          <div className="mt-6 overflow-x-auto border border-slate-200 bg-white">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Listings</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#0a1628]">
                        {seller.name}
                      </span>
                      <span className="ml-2 text-xs font-medium text-emerald-700">
                        Verified
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatLocation(seller)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatQuantity(seller.listingCount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={sellerSearchHref(seller)}
                        className="font-semibold text-[#c41230] hover:underline"
                      >
                        Search stock →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="font-medium text-[#0a1628]">Featured suppliers coming soon</p>
            <p className="mt-2 text-sm text-slate-600">
              Register your company and upload inventory to appear here.
            </p>
            <Link
              href="/company/upload"
              className="mt-4 inline-flex text-sm font-semibold text-[#c41230] hover:underline"
            >
              List Inventory →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
