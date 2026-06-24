import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PartsBackground } from "@/components/PartsBackground";
import { RecentUploadsList } from "@/components/RecentUploadsList";
import { QuickSearchLinks, SearchBar } from "@/components/SearchBar";
import { getRecentListings } from "@/lib/listings";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Free Part Find System for Electronic Components",
  description:
    "The most technically advanced part find system for electronic components is here — free to use. Search MPNs, paste part lists, and compare US supplier inventory on USParts.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const recentUploads = await getRecentListings();
  const hasUploads = recentUploads.length > 0;
  const siteUrl = getSiteUrl();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "USParts",
    url: siteUrl,
    description:
      "Free part find system for electronic components. Search manufacturer part numbers and compare US supplier inventory.",
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

      <section className="relative overflow-hidden border-b border-slate-200">
        <PartsBackground variant="hero" idPrefix="hero" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-12">
            <div className="shrink-0">
              <Image
                src="/brand/usparts-logo-hero-transparent.png"
                alt="USParts.US — Built to Perform"
                width={320}
                height={320}
                priority
                className="h-auto w-52 sm:w-60 lg:w-72"
              />
            </div>

            <div className="text-center lg:text-left">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Free part find system · US inventory prioritized
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Find the parts you need. List the inventory you have.
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                The most technically advanced part find system for electronic
                components is here — and it&apos;s free to use. Search single
                part numbers, paste a BOM, compare supplier stock, and request
                quotes without paying to search.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-3xl space-y-4">
            <SearchBar large />
            <QuickSearchLinks />
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row sm:gap-4">
              <Link
                href="/company/upload"
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
              >
                Upload inventory
              </Link>
              <Link
                href="/company"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white/90 px-6 py-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
              >
                Register as a supplier
              </Link>
            </div>
            <p className="text-center text-xs text-slate-500">
              Email a spreadsheet to upload@usparts.us or import CSV/Excel online.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              {
                title: "Advanced part find system",
                body: "Search by MPN, manufacturer, or keyword. Multi-part lookup matches variants and base part numbers in one indexed query.",
              },
              {
                title: "Compare suppliers",
                body: "See pricing, stock levels, lead times, and condition from multiple companies in one place.",
              },
              {
                title: "Free for buyers and suppliers",
                body: "No fee to search parts. Suppliers can register and list available stock for buyers to discover.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/60 bg-white/75 p-5 text-left shadow-sm shadow-blue-100/50 backdrop-blur-sm"
              >
                <h2 className="text-base font-semibold text-slate-900">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <PartsBackground variant="section" idPrefix="home-section" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Recent supplier uploads
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                The 10 most recent parts from each of the last 10 companies to
                upload inventory.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/company/upload"
                className="text-sm font-medium text-slate-900 hover:text-blue-700"
              >
                Upload inventory
              </Link>
              <Link
                href="/search"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Search parts
              </Link>
              <Link
                href="/search?mode=bulk"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Multi-part search
              </Link>
            </div>
          </div>

          {hasUploads ? (
            <RecentUploadsList groups={recentUploads} />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/90 p-10 text-center shadow-sm backdrop-blur-sm">
              <p className="text-lg font-medium text-slate-900">No listings yet</p>
              <p className="mt-2 text-sm text-slate-600">
                Be the first supplier to publish available components.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/company/upload"
                  className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Upload inventory
                </Link>
                <Link
                  href="/company"
                  className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Register your company
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
