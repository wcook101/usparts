import type { Metadata } from "next";
import Link from "next/link";
import { ManufacturerBrowseSection } from "@/components/home/ManufacturerBrowseSection";
import { GuidesPromoSection } from "@/components/home/GuidesPromoSection";
import { HomeCtaBanner } from "@/components/home/HomeCtaBanner";
import { HomeHero } from "@/components/home/HomeHero";
import { RecentUploadsList } from "@/components/RecentUploadsList";
import { FeaturedSellersSection } from "@/components/trust/FeaturedSellersSection";
import { TestimonialsSection } from "@/components/trust/TestimonialsSection";
import { getFeaturedSellers, getRecentListings } from "@/lib/listings";
import { getPlatformStats } from "@/lib/marketplace-stats";
import { getManufacturerIndexEntries } from "@/lib/manufacturers/pages";
import { getTopPartPages } from "@/lib/parts/part-pages";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Electronics Parts Marketplace - Free BOM Search & Inventory",
  },
  description:
    "Find electronic components from U.S. suppliers. Search 350,000+ listed parts, upload a BOM, request quotes, and list surplus inventory for free on USParts.us.",
  openGraph: {
    title: "Electronics Parts Marketplace - Free BOM Search & Inventory",
    description:
      "Find electronic components from U.S. suppliers. Free MPN search, bulk BOM lookup, and surplus inventory listings.",
  },
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const [recentUploads, featuredSellers, stats, popularParts, manufacturers] =
    await Promise.all([
      getRecentListings(),
      getFeaturedSellers(6),
      getPlatformStats(),
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
      "Free electronic component search and marketplace for BOM lookup, MPN search, and US supplier inventory.",
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

      <HomeHero stats={stats} popularParts={popularParts.map((part) => part.mpn)} />

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

      <FeaturedSellersSection sellers={featuredSellers} />
      <GuidesPromoSection />
      <TestimonialsSection />
      <HomeCtaBanner />
    </div>
  );
}
