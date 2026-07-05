import Link from "next/link";

const features = [
  {
    title: "MPN & BOM search",
    body: "Single part lookup, bulk BOM paste, and smart description search across indexed supplier inventory.",
    href: "/search?mode=bulk",
    cta: "Try BOM search",
  },
  {
    title: "US supplier priority",
    body: "Inventory locations and supplier profiles emphasize US stock for faster fulfillment and clearer sourcing.",
    href: "/about",
    cta: "About USParts",
  },
  {
    title: "Free marketplace listings",
    body: "Suppliers publish obsolete semiconductors, surplus ICs, and excess stock without a listing fee.",
    href: "/company",
    cta: "Become a supplier",
  },
  {
    title: "Guides & resources",
    body: "Product guides on BOM workflows, pricing, shortages, and selling surplus inventory.",
    href: "/blog",
    cta: "Read blog & guides",
  },
];

export function FeaturesSection() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Why USParts
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Everything you need to search, compare, and list parts
          </h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="flex h-full flex-col rounded-2xl border border-slate-200 p-6 transition hover:border-blue-200 hover:shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                {feature.body}
              </p>
              <Link
                href={feature.href}
                className="mt-5 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                {feature.cta} →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
