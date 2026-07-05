import Link from "next/link";
import { redirect } from "next/navigation";
import { CompanyProfileForm } from "@/components/CompanyProfileForm";
import { getSessionUser, userCanManageInventory } from "@/lib/auth";
import { getSessionCompany } from "@/lib/auth/resource-access";
import { getCompanyById } from "@/lib/company";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata.supplierSettings;

export default async function CompanySettingsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/company/settings");
  }

  if (!userCanManageInventory(user)) {
    redirect("/company/dashboard");
  }

  const sessionCompany = getSessionCompany(user);
  if (!sessionCompany) {
    redirect("/company");
  }

  const company = await getCompanyById(sessionCompany.id);
  if (!company) {
    redirect("/company");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/company/dashboard"
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Back to supplier dashboard
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Company profile
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Update how buyers see <strong>{company.name}</strong> on listings and
          search results.
        </p>

        <div className="mt-8">
          <CompanyProfileForm company={company} />
        </div>
      </div>
    </div>
  );
}
