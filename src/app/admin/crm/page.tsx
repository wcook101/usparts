import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerCrmAdminPanel } from "@/components/CustomerCrmAdminPanel";
import { getSessionUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.adminCustomerCrm;

export const dynamic = "force-dynamic";

export default async function AdminCustomerCrmPage() {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  if (!isPlatformAdmin(user.email)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Link
          href="/admin"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to admin
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Customer growth
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Customer CRM
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Track and market prospective buyers. Log outreach, send one-off emails, and
          watch leads convert when they create a US Parts account.
        </p>
      </div>

      <CustomerCrmAdminPanel />
    </div>
  );
}
