import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InventoryImportForm } from "@/components/InventoryImportForm";
import { getSessionUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { getCompaniesForAdminImport } from "@/lib/admin-import";
import { UPLOAD_EMAIL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.adminImport;

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/admin/import");
  }

  if (!isPlatformAdmin(user.email)) {
    notFound();
  }

  const companies = await getCompaniesForAdminImport();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/admin"
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        ← Back to admin
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Supplier onboarding
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        Import inventory for a supplier
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Use this when a supplier emails you a spreadsheet and says &ldquo;upload it
        for me.&rdquo; Pick their company, map columns, and publish their stock.
        Admin imports bypass the 24-hour supplier cooldown.
      </p>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <strong>Before you import:</strong> make sure the supplier has a company
        on USParts. If they emailed inventory but never registered,{" "}
        <Link
          href="/admin/companies/new"
          className="font-medium text-amber-900 underline"
        >
          create their company here
        </Link>
        , then come back to import. Match the spreadsheet to the correct company
        name below.
      </div>

      {companies.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-medium text-slate-900">No companies yet</p>
          <p className="mt-2 text-sm text-slate-600">
            Create a supplier company before importing their inventory.
          </p>
          <Link
            href="/admin/companies/new"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create company
          </Link>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <InventoryImportForm
            companies={companies.map((company) => ({
              id: company.id,
              name: company.name,
              lastImportAt: company.lastImportAt?.toISOString() ?? null,
              inventoryLocations: company.inventoryLocations,
            }))}
            previewApiPath="/api/admin/inventory/import/preview"
            importApiPath="/api/admin/inventory/import"
            bypassImportCooldown
            requireCompanySelection
            companySelectLabel="Supplier company"
          />
        </div>
      )}

      <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
        <h2 className="font-semibold text-slate-900">Email workflow</h2>
        <p className="mt-2">
          Suppliers can also email files directly to{" "}
          <span className="font-mono font-medium">{UPLOAD_EMAIL}</span>. When that
          happens, download the attachment from your mailbox and import it here.
        </p>
      </section>
    </div>
  );
}
