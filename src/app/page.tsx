import type { Metadata } from "next";
import Link from "next/link";
import { CategoryBrowseSection } from "@/components/home/CategoryBrowseSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HomeCtaBanner } from "@/components/home/HomeCtaBanner";
import { HomeHero } from "@/components/home/HomeHero";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { PartsBackground } from "@/components/PartsBackground";
import { RecentUploadsList } from "@/components/RecentUploadsList";
import { FeaturedSellersSection } from "@/components/trust/FeaturedSellersSection";
import { SecurityBadges } from "@/components/trust/SecurityBadges";
import { TestimonialsSection } from "@/components/trust/TestimonialsSection";
import { getFeaturedSellers, getRecentListings } from "@/lib/listings";
import {
  getCategoryListingCounts,
  getPlatformStats,
} from "@/lib/marketplace-stats";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Electronics Parts Marketplace - Free BOM Search & Inventory",
  },
  description:
    "Free BOM search and electronics marketplace – list inventory or find parts instantly. Search obsolete semiconductors, ICs, and surplus stock by MPN from US suppliers on USParts.us.",
  openGraph: {
    title: "Electronics Parts Marketplace - Free BOM Search & Inventory",
    description:
      "Search electronic components from US suppliers. Free MPN search, bulk BOM lookup, and surplus inventory listings.",
  },
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const [recentUploads, featuredSellers, stats, categoryCounts] =
    await Promise.all([
      getRecentListings(),
      getFeaturedSellers(6),
      getPlatformStats(),
      getCategoryListingCounts(),
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
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <HomeHero stats={stats} />

      <section className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SecurityBadges />
        </div>
      </section>

      <CategoryBrowseSection counts={categoryCounts} />
      <HowItWorksSection />
      <FeaturesSection />
      <FeaturedSellersSection sellers={featuredSellers} />
      <TestimonialsSection />

      <section className="border-b border-slate-200 bg-slate-50/80">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Resources
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
                Guides for sourcing and selling electronic parts
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                BOM search best practices, pricing tips, shortage planning, and
                surplus inventory guides for procurement teams.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex w-fit rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Browse all articles
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                href: "/blog/bom-search-best-practices-for-new-users",
                title: "BOM search best practices",
                body: "Paste your first BOM, review matches, and request quotes like a pro.",
              },
              {
                href: "/blog/how-mpn-search-works-on-usparts",
                title: "How MPN search works",
                body: "Full and partial part number matching behind the scenes.",
              },
              {
                href: "/blog/best-component-pricing-with-bom-search",
                title: "Get the best component pricing",
                body: "Compare listed prices and quote-only lines on your BOM.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-slate-200">
        <PartsBackground variant="section" idPrefix="home-section" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                Recent supplier uploads
              </h2>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                Live inventory from the latest companies to publish stock on
                USParts.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Search all parts
              </Link>
              <Link
                href="/company/upload"
                className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Upload inventory
              </Link>
            </div>
          </div>

          {hasUploads ? (
            <RecentUploadsList groups={recentUploads} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/90 p-10 text-center shadow-sm backdrop-blur-sm">
              <p className="text-lg font-medium text-slate-900">No listings yet</p>
              <p className="mt-2 text-sm text-slate-600">
                Be the first supplier to publish available components.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/company/upload"
                  className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Upload inventory
                </Link>
                <Link
                  href="/company"
                  className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Register your company
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <HomeCtaBanner />
    </div>
  );
}
