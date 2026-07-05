import Link from "next/link";

const buyerSteps = [
  {
    step: "1",
    title: "Search MPN or paste a BOM",
    body: "Look up a single part number or upload hundreds of lines at once with free bulk BOM search.",
  },
  {
    step: "2",
    title: "Compare US supplier stock",
    body: "Review pricing, quantity, condition, and warehouse location from multiple suppliers in one view.",
  },
  {
    step: "3",
    title: "Quote or purchase",
    body: "Request quotes on price-on-request lines or place orders when pricing and stock are published.",
  },
];

const supplierSteps = [
  {
    step: "1",
    title: "Register your company",
    body: "Create a free supplier account and add your company profile for buyers to trust.",
  },
  {
    step: "2",
    title: "Upload inventory",
    body: "Email a spreadsheet or import CSV/Excel with MPNs, quantities, and pricing.",
  },
  {
    step: "3",
    title: "Get discovered by buyers",
    body: "Your stock appears in MPN and BOM search results when buyers source obsolete and surplus parts.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-b border-slate-200 bg-slate-50/80">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            How it works
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Source parts faster. Sell surplus inventory for free.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            USParts is built for procurement teams and inventory managers who
            need a clear path from search to quote — without paying to search.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">For buyers</h3>
              <Link
                href="/search"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Start searching →
              </Link>
            </div>
            <ol className="mt-6 space-y-5">
              {buyerSteps.map((item) => (
                <li key={item.step} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {item.step}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">For suppliers</h3>
              <Link
                href="/company"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                List inventory →
              </Link>
            </div>
            <ol className="mt-6 space-y-5">
              {supplierSteps.map((item) => (
                <li key={item.step} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    {item.step}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
