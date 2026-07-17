import Link from "next/link";
import { notFound } from "next/navigation";
import { RfqAdminPanel } from "@/components/RfqAdminPanel";
import { getSessionUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.adminRfqs;

export const dynamic = "force-dynamic";

export default async function AdminRfqsPage() {
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
          Buyer activity
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          RFQ activity
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          See when buyers request quotes from part pages or submit bulk RFQs from
          BOM search. This is the on-site audit trail for quote requests.
        </p>
      </div>

      <RfqAdminPanel />
    </div>
  );
}
