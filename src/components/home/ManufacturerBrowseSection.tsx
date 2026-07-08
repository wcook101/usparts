import Link from "next/link";
import { formatQuantity } from "@/lib/format";
import { getManufacturerPagePath } from "@/lib/manufacturers/catalog";
import type { ManufacturerIndexEntry } from "@/lib/manufacturers/pages";

type ManufacturerBrowseSectionProps = {
  manufacturers: ManufacturerIndexEntry[];
};

export function ManufacturerBrowseSection({
  manufacturers,
}: ManufacturerBrowseSectionProps) {
  const featured = manufacturers
    .filter((entry) => entry.listingCount > 0)
    .slice(0, 8);
  const display = featured.length > 0 ? featured : manufacturers.slice(0, 8);

  return (
    <section className="border-b border-slate-200 bg-slate-50/50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#0a1628] sm:text-2xl">
              Browse by manufacturer
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Texas Instruments, Analog Devices, Microchip, and more.
            </p>
          </div>
          <Link
            href="/manufacturers"
            className="text-sm font-semibold text-[#c41230] hover:underline"
          >
            All manufacturers →
          </Link>
        </div>

        <div className="mt-6 overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Manufacturer</th>
                <th className="px-4 py-3">Focus</th>
                <th className="px-4 py-3 text-right">Parts</th>
                <th className="px-4 py-3 text-right">Listings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {display.map(({ profile, listingCount, partCount }) => (
                <tr key={profile.slug} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link
                      href={getManufacturerPagePath(profile.slug)}
                      className="font-semibold text-[#0a1628] hover:text-[#c41230]"
                    >
                      {profile.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {profile.productFamilies.slice(0, 2).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {partCount > 0 ? formatQuantity(partCount) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {listingCount > 0 ? formatQuantity(listingCount) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
