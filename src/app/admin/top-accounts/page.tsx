import Link from "next/link";
import { notFound } from "next/navigation";
import { PriorityAccountsAdminPanel } from "@/components/PriorityAccountsAdminPanel";
import { getSessionUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.adminTopAccounts;

export const dynamic = "force-dynamic";

export default async function AdminTopAccountsPage() {
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
          Supplier acquisition
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Top 25 priority accounts
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Focus list for deeper research. Find decision-maker emails, titles, and
          notes before you outreach. Separate from the general supplier tracker.
        </p>
      </div>

      <PriorityAccountsAdminPanel />
    </div>
  );
}
