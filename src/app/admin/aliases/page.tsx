import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PartAliasAdminPanel } from "@/components/PartAliasAdminPanel";
import { getSessionUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.adminAliases;

export const dynamic = "force-dynamic";

export default async function AdminAliasesPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/admin/aliases");
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
          Search intelligence
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Part alias mapping
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Cross-reference pairs used when bulk search finds zero exact matches. Aliases
          are checked only on misses — they do not slow down primary search.
        </p>
      </div>

      <PartAliasAdminPanel />
    </div>
  );
}
