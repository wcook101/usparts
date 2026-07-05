import Link from "next/link";

export function HomeCtaBanner() {
  return (
    <section className="bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to source or sell electronic components?
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
            Search MPNs and BOMs for free, compare US supplier inventory, or
            publish surplus semiconductors and ICs to the marketplace today.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/search"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-500 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-blue-400"
            >
              Search parts free
            </Link>
            <Link
              href="/company/upload"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-600 bg-transparent px-8 py-3.5 text-base font-semibold text-white transition hover:bg-slate-800"
            >
              Upload inventory
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
