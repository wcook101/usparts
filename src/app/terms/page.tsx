import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Legal
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-slate-500">Last updated: June 2026</p>

      <div className="prose prose-slate mt-8 max-w-none space-y-6 text-sm leading-7 text-slate-700">
        <p>
          These are placeholder terms for the USParts development environment.
          Replace with counsel-reviewed language before a public launch.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Marketplace role</h2>
          <p className="mt-2">
            USParts provides a platform for buyers to discover electronic
            components and for suppliers to list available inventory. USParts is
            not a party to transactions between buyers and suppliers unless
            explicitly stated otherwise.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Accounts</h2>
          <p className="mt-2">
            You are responsible for safeguarding your account credentials and
            for activity under your account. Supplier accounts must use accurate
            company information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Listings and orders</h2>
          <p className="mt-2">
            Suppliers are responsible for the accuracy of listings, pricing, and
            fulfillment. Buyers are responsible for verifying part suitability
            before purchase.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Limitation of liability</h2>
          <p className="mt-2">
            The service is provided as-is during development. Use at your own
            risk until formal production terms are published.
          </p>
        </section>
      </div>

      <Link
        href="/"
        className="mt-10 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Back to home
      </Link>
    </div>
  );
}
