import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SupplierOutreachAdminPanel } from "@/components/SupplierOutreachAdminPanel";
import { getSessionUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.adminOutreach;

export const dynamic = "force-dynamic";

export default async function AdminOutreachPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/admin/outreach");
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
          Supplier growth
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Outreach tracker
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Keep a running list of suppliers you have asked to join USParts and upload
          inventory. Status updates automatically when their email matches a registered
          company or when they import stock.
        </p>
      </div>

      <SupplierOutreachAdminPanel />
    </div>
  );
}
