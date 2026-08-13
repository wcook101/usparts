import type { Metadata } from "next";
import Link from "next/link";
import { ManufacturerBrowseSection } from "@/components/home/ManufacturerBrowseSection";
import { GuidesPromoSection } from "@/components/home/GuidesPromoSection";
import { HomeCtaBanner } from "@/components/home/HomeCtaBanner";
import { HomeHero } from "@/components/home/HomeHero";
import { RecentUploadsList } from "@/components/RecentUploadsList";
import { TestimonialsSection } from "@/components/trust/TestimonialsSection";
import { getRecentListings } from "@/lib/listings";
import { getManufacturerIndexEntries } from "@/lib/manufacturers/pages";
import { getTopPartPages } from "@/lib/parts/part-pages";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    // 55 characters, so Google does not truncate it. "Marketplace" is deliberate and
    // consistent sitewide: it puts us alongside buy/sell exchanges rather than against
    // aggregated part-search engines, which is a fight over a different keyword set.
    absolute: "Electronic Component Marketplace | ICs & Semiconductors",
  },
  description:
    "Source hard-to-find ICs, semiconductors and obsolete electronic components from US suppliers. Check price and availability, cross-reference parts, or upload a BOM free.",
  openGraph: {
    title: "Electronic Component Marketplace | ICs & Semiconductors",
    description:
      "Buy and sell ICs, semiconductors, obsolete and surplus electronic components. Free MPN search, price and availability, bulk BOM lookup, and US supplier listings.",
  },
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const [recentUploads, popularParts, manufacturers] = await Promise.all([
    getRecentListings(),
    getTopPartPages(4),
    getManufacturerIndexEntries(),
  ]);
  const hasUploads = recentUploads.length > 0;
  const siteUrl = getSiteUrl();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "USParts",
    url: siteUrl,
    description:
      "Free electronic component marketplace for ICs, semiconductors, obsolete and surplus parts, with MPN search, BOM lookup, and US supplier inventory.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <HomeHero popularParts={popularParts.map((part) => part.mpn)} />

      <ManufacturerBrowseSection manufacturers={manufacturers} />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#0a1628] sm:text-2xl">
                Recent supplier uploads
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Latest inventory published by suppliers on USParts.
              </p>
            </div>
            <Link
              href="/search"
              className="text-sm font-semibold text-[#c41230] hover:underline"
            >
              Search all parts →
            </Link>
          </div>

          {hasUploads ? (
            <RecentUploadsList groups={recentUploads} />
          ) : (
            <div className="border border-dashed border-slate-300 px-6 py-10 text-center">
              <p className="font-medium text-[#0a1628]">No listings yet</p>
              <p className="mt-2 text-sm text-slate-600">
                Be the first supplier to publish available components.
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

      <GuidesPromoSection />
      <TestimonialsSection />
      <HomeCtaBanner />
    </div>
  );
}
