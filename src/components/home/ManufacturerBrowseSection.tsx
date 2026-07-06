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
  const featured = manufacturers.filter((entry) => entry.listingCount > 0).slice(0, 6);
  const display = featured.length > 0 ? featured : manufacturers.slice(0, 6);

  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Browse by manufacturer
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
              Texas Instruments, Analog Devices, Microchip, and more
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Authority pages for major semiconductor brands — live US stock,
              top MPNs, and filtered search for procurement teams.
            </p>
          </div>
          <Link
            href="/manufacturers"
            className="inline-flex w-fit rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            All manufacturers
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {display.map(({ profile, listingCount, partCount }) => (
            <Link
              key={profile.slug}
              href={getManufacturerPagePath(profile.slug)}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700">
                {profile.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-2">
                {profile.productFamilies.slice(0, 2).join(" · ")}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-blue-600">
                {listingCount > 0
                  ? `${formatQuantity(partCount)} parts · ${formatQuantity(listingCount)} listings`
                  : "View manufacturer page"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
