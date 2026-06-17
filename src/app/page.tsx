import Link from "next/link";
import { PartsBackground } from "@/components/PartsBackground";
import { RecentUploadsList } from "@/components/RecentUploadsList";
import { QuickSearchLinks, SearchBar } from "@/components/SearchBar";
import { getRecentListings } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recentUploads = await getRecentListings();
  const hasUploads = recentUploads.length > 0;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-200">
        <PartsBackground variant="hero" idPrefix="hero" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              We prioritize parts located in the US
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Find the parts you need. List the inventory you have.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              USParts connects buyers searching for electronic components with
              companies ready to fulfill production and repair orders.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl space-y-4">
            <SearchBar large />
            <QuickSearchLinks />
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              {
                title: "Search by MPN",
                body: "Look up manufacturer part numbers, descriptions, and categories in one place.",
              },
              {
                title: "Compare suppliers",
                body: "See pricing, stock levels, lead times, and condition from multiple companies.",
              },
              {
                title: "Publish inventory",
                body: "Suppliers can register and list available stock for buyers to discover.",
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
            <Link
              href="/search"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Search parts
            </Link>
          </div>

          {hasUploads ? (
            <RecentUploadsList groups={recentUploads} />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/90 p-10 text-center shadow-sm backdrop-blur-sm">
              <p className="text-lg font-medium text-slate-900">No listings yet</p>
              <p className="mt-2 text-sm text-slate-600">
                Be the first supplier to publish available components.
              </p>
              <Link
                href="/company"
                className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Register your company
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
