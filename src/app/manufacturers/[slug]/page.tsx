import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingResultsList } from "@/components/ListingResultsList";
import { CATEGORY_LABELS, formatPrice, formatQuantity } from "@/lib/format";
import {
  getAllManufacturerProfiles,
  getManufacturerPagePath,
  getManufacturerSearchPath,
} from "@/lib/manufacturers/catalog";
import {
  getManufacturerPageData,
  getPartPagePath,
} from "@/lib/manufacturers/pages";
import {
  manufacturerPageMetadata,
  manufacturerPageNotFoundMetadata,
} from "@/lib/seo/page-metadata";
import { getSiteUrl } from "@/lib/site";

type ManufacturerPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getAllManufacturerProfiles().map((profile) => ({
    slug: profile.slug,
  }));
}

export async function generateMetadata({
  params,
}: ManufacturerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getManufacturerPageData(slug);

  if (!data) {
    return manufacturerPageNotFoundMetadata();
  }

  const meta = manufacturerPageMetadata({
    name: data.profile.name,
    listingCount: data.listingCount,
    partCount: data.partCount,
  });

  return {
    ...meta,
    alternates: {
      canonical: getManufacturerPagePath(data.profile.slug),
    },
  };
}

export default async function ManufacturerPage({ params }: ManufacturerPageProps) {
  const { slug } = await params;
  const data = await getManufacturerPageData(slug);

  if (!data) {
    notFound();
  }

  const { profile } = data;
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${getManufacturerPagePath(profile.slug)}`;

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: profile.name,
    url: profile.website,
    description: profile.description,
    sameAs: [profile.website],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Manufacturers",
        item: `${siteUrl}/manufacturers`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: profile.name,
        item: pageUrl,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-700">
          Home
        </Link>
        <span>/</span>
        <Link href="/manufacturers" className="hover:text-blue-700">
          Manufacturers
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-700">{profile.name}</span>
      </nav>

      <header className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Manufacturer
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {profile.name} parts from US suppliers
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            {profile.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={data.searchPath}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Search {profile.name} inventory
            </Link>
            <Link
              href={`/search?mode=bulk&manufacturer=${encodeURIComponent(profile.searchTerm)}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Add to BOM search
            </Link>
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Official site
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Part numbers
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatQuantity(data.partCount)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Listings
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatQuantity(data.listingCount)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Suppliers
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatQuantity(data.supplierCount)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total stock
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatQuantity(data.totalQuantity)}
            </p>
          </div>
        </div>
      </header>

      {profile.productFamilies.length > 0 ? (
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Popular families</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.productFamilies.map((family) => (
              <span
                key={family}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
              >
                {family}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {data.categoryCounts.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">Browse by category</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.categoryCounts.map((item) => (
              <Link
                key={item.category}
                href={`${data.searchPath}&category=${encodeURIComponent(item.category)}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-4 hover:border-blue-200 hover:shadow-sm"
              >
                <p className="font-medium text-slate-900">
                  {CATEGORY_LABELS[item.category]}
                </p>
                <p className="mt-1 text-sm text-blue-600">
                  {formatQuantity(item.count)} listings
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {data.topParts.length > 0 ? (
        <section className="mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Top part numbers</h2>
              <p className="mt-1 text-sm text-slate-600">
                Most-listed {profile.name} MPNs on USParts right now.
              </p>
            </div>
            <Link
              href={data.searchPath}
              className="text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              View all {profile.name} results
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.topParts.map((part) => (
              <Link
                key={part.mpnNormalized}
                href={getPartPagePath(part.mpn)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-4 transition hover:border-blue-200 hover:shadow-sm"
              >
                <p className="font-mono text-base font-semibold text-blue-700">
                  {part.mpn}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span>{formatQuantity(part.totalQuantity)} in stock</span>
                  <span>
                    {part.lowestPrice !== null
                      ? `From ${formatPrice(part.lowestPrice)}`
                      : "Quote"}
                  </span>
                  <span>
                    {part.listingCount} listing{part.listingCount === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-slate-900">
          Recent {profile.name} listings
        </h2>
        {data.recentListings.length > 0 ? (
          <div className="mt-5">
            <ListingResultsList listings={data.recentListings} />
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm leading-6 text-slate-600">
              No active US supplier listings for {profile.name} yet. Run a search
              to check related inventory, or list your own stock if you are a
              distributor.
            </p>
            <Link
              href="/company/upload"
              className="mt-4 inline-flex rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              List inventory
            </Link>
          </div>
        )}
      </section>

      <section className="mt-12 rounded-2xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Sourcing {profile.name} components?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Upload a BOM, compare multiple US offers per MPN, and request quotes
          without leaving USParts.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={getManufacturerSearchPath(profile)}
            className="inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Search {profile.name}
          </Link>
          <Link
            href="/manufacturers"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            All manufacturers
          </Link>
        </div>
      </section>
    </div>
  );
}
