import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PartImagePlaceholder } from "@/components/parts/PartImagePlaceholder";
import { DatasheetSection } from "@/components/parts/DatasheetSection";
import { PartSupplierListings } from "@/components/parts/PartSupplierListings";
import { RelatedPartsSection } from "@/components/parts/RelatedPartsSection";
import {
  CATEGORY_LABELS,
  formatPrice,
  formatQuantity,
} from "@/lib/format";
import { getSessionUser } from "@/lib/auth/session";
import { getPartPagePath } from "@/lib/parts/part-path";
import { getPartPageData } from "@/lib/parts/part-pages";
import {
  partPageMetadata,
  partPageNotFoundMetadata,
} from "@/lib/seo/page-metadata";
import { getSiteUrl } from "@/lib/site";

type PartPageProps = {
  params: Promise<{ mpn: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PartPageProps): Promise<Metadata> {
  const { mpn: mpnSlug } = await params;
  const part = await getPartPageData(mpnSlug);

  if (!part) {
    return partPageNotFoundMetadata(decodeURIComponent(mpnSlug));
  }

  const meta = partPageMetadata({
    mpn: part.mpn,
    manufacturer: part.primaryManufacturer,
    description: part.description,
    supplierCount: part.supplierCount,
    totalQuantity: part.totalQuantity,
    lowestPrice: part.lowestPrice,
  });

  return {
    ...meta,
    alternates: {
      canonical: getPartPagePath(part.mpn),
    },
  };
}

export default async function PartPage({ params }: PartPageProps) {
  const { mpn: mpnSlug } = await params;
  const part = await getPartPageData(mpnSlug);

  if (!part) {
    notFound();
  }

  if (part.canonicalRedirectPath) {
    redirect(part.canonicalRedirectPath);
  }

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${getPartPagePath(part.mpn)}`;
  const sessionUser = await getSessionUser();
  const displayMpn = part.matchType === "family" ? part.queryMpn : part.mpn;
  const categoryLabel = part.category ? CATEGORY_LABELS[part.category] : null;
  const primaryListing = part.listings[0] ?? null;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: part.mpn,
    sku: part.mpn,
    mpn: part.mpn,
    description:
      part.description ??
      `${part.mpn} electronic component available from US suppliers on USParts.us`,
    brand: part.primaryManufacturer
      ? { "@type": "Brand", name: part.primaryManufacturer }
      : undefined,
    category: categoryLabel ?? undefined,
    url: pageUrl,
    offers: part.listings.slice(0, 20).map((listing) => ({
      "@type": "Offer",
      url: `${siteUrl}/listings/${listing.id}`,
      priceCurrency: listing.currency,
      price: listing.price ? Number(listing.price) : undefined,
      availability:
        listing.quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: listing.company.name,
      },
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-700">
          Home
        </Link>
        <span>/</span>
        <Link href="/search" className="hover:text-blue-700">
          Search
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-700">{part.mpn}</span>
      </nav>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <PartImagePlaceholder
          mpn={part.mpn}
          category={part.category}
          manufacturer={part.primaryManufacturer}
        />

        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
            {categoryLabel ?? "Electronic component"}
          </p>
          <h1 className="mt-3 font-mono text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {displayMpn}
          </h1>
          {part.matchType === "family" ? (
            <p className="mt-2 text-sm text-slate-600">
              Showing supplier stock for {part.matchedMpns.join(", ")}
            </p>
          ) : null}
          {part.primaryManufacturer ? (
            <p className="mt-3 text-lg text-slate-700">{part.primaryManufacturer}</p>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total stock
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatQuantity(part.totalQuantity)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Suppliers
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatQuantity(part.supplierCount)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                From
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {part.lowestPrice !== null
                  ? formatPrice(part.lowestPrice, primaryListing?.currency ?? "USD")
                  : "Quote"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {primaryListing ? (
              <Link
                href={`/listings/${primaryListing.id}`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700"
              >
                Request quote
              </Link>
            ) : null}
            <Link
              href={`/search?q=${encodeURIComponent(part.mpn)}`}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50"
            >
              Search all offers
            </Link>
            <Link
              href={`/search?mode=bulk&mpns=${encodeURIComponent(part.mpn)}`}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50"
            >
              Add to BOM search
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900">Description</h2>
          {part.description ? (
            <p className="mt-4 leading-7 text-slate-700">{part.description}</p>
          ) : (
            <p className="mt-4 leading-7 text-slate-600">
              {part.mpn} is listed by {part.supplierCount} US supplier
              {part.supplierCount === 1 ? "" : "s"} on USParts.us. Compare stock,
              pricing, and condition below, then request a quote from the supplier that
              fits your build.
            </p>
          )}

          <DatasheetSection
            mpn={part.mpn}
            mpnNormalized={part.mpnNormalized}
            manufacturer={part.primaryManufacturer}
            datasheetUrls={part.datasheetUrls}
            quoteHref={primaryListing ? `/listings/${primaryListing.id}` : null}
            supplierCount={part.supplierCount}
            isLoggedIn={Boolean(sessionUser)}
          />

          <div className="mt-6 flex flex-wrap gap-3">
            {part.category ? (
              <Link
                href={`/search?category=${encodeURIComponent(part.category)}`}
                className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Browse {categoryLabel}
              </Link>
            ) : null}
          </div>

          {part.manufacturers.length > 1 ? (
            <p className="mt-6 text-sm text-slate-600">
              Manufacturers on file: {part.manufacturers.join(", ")}
            </p>
          ) : null}
        </section>

        <RelatedPartsSection parts={part.relatedParts} currentMpn={part.mpn} />
      </div>

      <div className="mt-10">
        <PartSupplierListings listings={part.listings} mpn={part.mpn} />
      </div>
    </div>
  );
}
