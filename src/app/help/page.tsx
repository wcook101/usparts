import Link from "next/link";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";

export const metadata = {
  title: "Help",
  description: "Get help using USParts — contact support, browse parts, or list inventory.",
};

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Support
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        How can we help?
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        USParts is a marketplace that connects buyers with suppliers listing
        electronic component inventory. Suppliers handle sales, pricing, and
        fulfillment directly with buyers.
      </p>

      <section className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Contact support</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          For account issues, listing problems, order or quote questions, or
          anything else about the platform, email us and we will get back to you.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={SUPPORT_MAILTO}
            className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Email {SUPPORT_EMAIL}
          </a>
          <p className="font-mono text-sm text-slate-700">{SUPPORT_EMAIL}</p>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          If the email button does not open your mail app, copy the address above
          into your inbox.
        </p>
      </section>

      <div className="mt-10 space-y-8 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Buyers</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <Link href="/search" className="font-medium text-blue-600 hover:text-blue-700">
                Search for parts
              </Link>{" "}
              by part number, manufacturer, or description — no account required.
            </li>
            <li>
              On a listing, use <strong>Buy now</strong> when a price is shown, or{" "}
              <strong>Request a quote</strong> when pricing is on request.
            </li>
            <li>
              The supplier receives your contact details and will follow up
              directly regarding payment, shipping, and fulfillment.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Suppliers</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
                Create an account
              </Link>{" "}
              and register your company with at least one warehouse location.
            </li>
            <li>
              Add listings manually or use{" "}
              <Link href="/company/import" className="font-medium text-blue-600 hover:text-blue-700">
                bulk import
              </Link>{" "}
              to upload inventory from a spreadsheet.
            </li>
            <li>
              Manage orders and quote requests from your{" "}
              <Link href="/company/inbox" className="font-medium text-blue-600 hover:text-blue-700">
                supplier inbox
              </Link>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Policies</h2>
          <p className="mt-2">
            See our{" "}
            <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-700">
              Privacy Policy
            </Link>{" "}
            for how the marketplace operates and how we handle your information.
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
