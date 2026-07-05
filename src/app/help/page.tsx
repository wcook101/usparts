import Link from "next/link";
import { SupportContactForm } from "@/components/SupportContactForm";
import { getBuyerDefaults, getSessionUser } from "@/lib/auth";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata = {
  title: "Help & Support — Electronic Component Search & Supplier Listings",
  description:
    "Get help searching obsolete semiconductors and MPNs, uploading supplier inventory, requesting quotes, and using bulk BOM search on USParts.us.",
};

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const user = await getSessionUser();
  const buyerDefaults = getBuyerDefaults(user);
  const contactDefaults = buyerDefaults
    ? {
        name: buyerDefaults.buyerName,
        email: buyerDefaults.buyerEmail,
        company: buyerDefaults.buyerCompany || undefined,
      }
    : null;

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

      <section
        id="contact"
        className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900">Contact support</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Send us a message below for account issues, listing problems, order or
          quote questions, or anything else about the platform. We will reply to
          the email address you provide.
        </p>
        <SupportContactForm contactDefaults={contactDefaults} />
        <p className="mt-4 text-xs text-slate-500">
          You can also email us directly at{" "}
          <span className="font-mono text-slate-600">{SUPPORT_EMAIL}</span>.
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
              Email your spreadsheet to{" "}
              <Link href="/company/upload" className="font-medium text-blue-600 hover:text-blue-700">
                upload@usparts.us
              </Link>{" "}
              and our team will import it for you — no online upload required.
            </li>
            <li>
              Or use{" "}
              <Link href="/company/import" className="font-medium text-blue-600 hover:text-blue-700">
                bulk import online
              </Link>{" "}
              from a CSV or Excel file.
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
