import type { Metadata } from "next";
import Link from "next/link";
import { formatQuantity } from "@/lib/format";
import {
  getAllManufacturerProfiles,
  getManufacturerPagePath,
} from "@/lib/manufacturers/catalog";
import { getManufacturerIndexEntries } from "@/lib/manufacturers/pages";
import { manufacturersIndexMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = manufacturersIndexMetadata();

export default async function ManufacturersIndexPage() {
  const entries = await getManufacturerIndexEntries();
  const profileOrder = new Map(
    getAllManufacturerProfiles().map((profile, index) => [profile.slug, index]),
  );

  const sorted = [...entries].sort((a, b) => {
    const orderA = profileOrder.get(a.profile.slug) ?? 999;
    const orderB = profileOrder.get(b.profile.slug) ?? 999;
    if (a.listingCount !== b.listingCount) {
      return b.listingCount - a.listingCount;
    }
    return orderA - orderB;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-700">
          Home
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-700">Manufacturers</span>
      </nav>

      <div className="mt-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Manufacturer directory
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Browse parts by semiconductor manufacturer
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Authority pages for major analog, MCU, memory, and power IC brands.
          Each profile links to live US supplier stock, top MPNs, and filtered
          search — built for procurement teams sourcing TI, ADI, Microchip, and
          more.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map(({ profile, listingCount, partCount }) => (
          <Link
            key={profile.slug}
            href={getManufacturerPagePath(profile.slug)}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-700">
              {profile.name}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-3">
              {profile.description}
            </p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-blue-600">
              {listingCount > 0
                ? `${formatQuantity(partCount)} parts · ${formatQuantity(listingCount)} listings`
                : "View manufacturer page"}
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Search across all manufacturers
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use MPN search or paste a BOM to compare offers from every supplier on
          USParts — then drill into a manufacturer page when you need focused
          stock visibility.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/search"
            className="inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Search parts
          </Link>
          <Link
            href="/search?mode=bulk"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Bulk BOM search
          </Link>
        </div>
      </section>
    </div>
  );
}
