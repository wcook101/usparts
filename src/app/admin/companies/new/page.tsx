import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCreateCompanyForm } from "@/components/AdminCreateCompanyForm";
import { getSessionUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.adminCreateCompany;

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function AdminCreateCompanyPage({ searchParams }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  if (!isPlatformAdmin(user.email)) {
    notFound();
  }

  const params = await searchParams;
  const prefillEmail = params.email?.trim() ?? "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
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
        Create company for a supplier
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        Use this when someone emails you inventory but has not registered a
        company yet. After creating the profile, import their spreadsheet on the
        import page.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <AdminCreateCompanyForm
          defaultEmail={prefillEmail}
          defaultOwnerEmail={prefillEmail}
        />
      </div>
    </div>
  );
}
