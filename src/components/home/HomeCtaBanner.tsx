import Link from "next/link";

export function HomeCtaBanner() {
  return (
    <section className="border-t border-slate-800 bg-[#0a1628]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Source or sell electronic components
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            Search MPNs and BOMs free, or publish surplus inventory to the
            marketplace.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center justify-center rounded bg-[#c41230] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a50e28]"
            >
              Search Parts
            </Link>
            <Link
              href="/search?mode=bulk"
              className="inline-flex min-h-11 items-center justify-center rounded border border-slate-500 bg-transparent px-6 py-2.5 text-sm font-semibold text-white transition hover:border-slate-300 hover:bg-white/5"
            >
              Upload BOM
            </Link>
            <Link
              href="/company/upload"
              className="inline-flex min-h-11 items-center justify-center rounded border border-slate-500 bg-transparent px-6 py-2.5 text-sm font-semibold text-white transition hover:border-slate-300 hover:bg-white/5"
            >
              List Inventory
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
