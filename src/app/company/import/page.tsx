import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailInventoryUploadPanel } from "@/components/EmailInventoryUploadPanel";
import { InventoryImportForm } from "@/components/InventoryImportForm";
import { getSessionUser, userCanManageInventory } from "@/lib/auth";
import { getSessionCompany } from "@/lib/auth/resource-access";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bulk Import Inventory",
};

export default async function ImportInventoryPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/company/import");
  }

  if (!userCanManageInventory(user)) {
    redirect("/company/dashboard");
  }

  const company = getSessionCompany(user);
  if (!company) {
    redirect("/company");
  }

  const inventoryLocations = await db.inventoryLocation.findMany({
    where: { companyId: company.id },
    select: {
      id: true,
      label: true,
      city: true,
      state: true,
      country: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const companies = [
    {
      id: company.id,
      name: company.name,
      lastImportAt: company.lastImportAt?.toISOString() ?? null,
      inventoryLocations,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/company/dashboard"
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Back to supplier dashboard
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Bulk inventory import
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Upload your parts database
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Importing for <strong>{company.name}</strong>. Upload online below, or
          email your file to us if that is easier.
        </p>

        <div className="mt-6">
          <EmailInventoryUploadPanel
            companyName={company.name}
            contactEmail={user.email}
            contactName={user.name}
            showOnlineImportLink={false}
          />
        </div>

        <div className="mt-8 border-t border-slate-200 pt-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Option 2
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            Upload online
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Upload up to 100,000 parts from CSV, Excel (.xlsx/.xls), or JSON.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/templates/inventory-import-template.csv"
            download
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Download CSV template
          </a>
          <Link
            href="/company/listings/new"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Add one part manually
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <InventoryImportForm companies={companies} />
          </div>

          <aside className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Field matching
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your file does not need our exact column names. After upload,
                match your columns to USParts fields. Use{" "}
                <strong>Exclude column</strong> for fields you do not want
                imported.
              </p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Import limits
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Up to 100,000 rows per upload</li>
                <li>One fully successful import every 24 hours (zero row errors)</li>
              </ul>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-semibold text-slate-900">
                Required matches
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Part number (MPN)</li>
                <li>Quantity in stock</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
