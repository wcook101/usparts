import Link from "next/link";
import { EmailInventoryUploadPanel } from "@/components/EmailInventoryUploadPanel";
import { getSessionUser } from "@/lib/auth";
import { UPLOAD_EMAIL } from "@/lib/site";

export const metadata = {
  title: "Email Electronic Component Inventory Upload for Suppliers",
  description:
    "Email your semiconductor and electronic parts spreadsheet to upload@usparts.us. Our team imports MPNs, quantities, and pricing so buyers can search your surplus inventory on USParts.us.",
};

export const dynamic = "force-dynamic";

export default async function EmailUploadPage() {
  const user = await getSessionUser();
  const company = user?.membership?.company ?? user?.company ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href={company ? "/company/dashboard" : "/company"}
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        {company ? "Back to supplier dashboard" : "Back to supplier portal"}
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Supplier inventory
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        Send inventory by email
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Email your spreadsheet to{" "}
        <span className="font-mono font-medium text-slate-800">{UPLOAD_EMAIL}</span>{" "}
        and we will load it on USParts for you. You do not need to figure out the
        online import tool.
      </p>

      <div className="mt-8">
        <EmailInventoryUploadPanel
          companyName={company?.name}
          contactEmail={user?.email}
          contactName={user?.name}
          showOnlineImportLink={Boolean(company)}
        />
      </div>

      {!user ? (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700">
          <h2 className="font-semibold text-slate-900">Do I need an account first?</h2>
          <p className="mt-2">
            You can email your file anytime. If you are not registered yet, include
            your company details in the email and we will help you get set up.
            For the fastest import,{" "}
            <Link href="/signup?next=/company/upload" className="font-medium text-blue-600 hover:text-blue-700">
              create a supplier account
            </Link>{" "}
            first so we can match the file to your company automatically.
          </p>
        </section>
      ) : null}

      <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
        <h2 className="font-semibold text-slate-900">What we need in your file</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Part number (MPN)</strong> and <strong>quantity in stock</strong>{" "}
            on every row
          </li>
          <li>Manufacturer, price, description, and warehouse location if you have them</li>
          <li>CSV, Excel (.xlsx / .xls), or a file exported from your inventory system</li>
        </ul>
      </section>
    </div>
  );
}
