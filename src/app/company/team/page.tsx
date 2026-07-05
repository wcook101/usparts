import { redirect } from "next/navigation";
import { CompanyTeamPanel } from "@/components/CompanyTeamPanel";
import { LogoutButton } from "@/components/LogoutButton";
import { getSessionUser } from "@/lib/auth";
import { canInviteMembers } from "@/lib/auth/membership";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata.supplierTeam;

export default async function CompanyTeamPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/company/team");
  }

  const role = user.membership?.role ?? (user.company ? "OWNER" : null);

  if (!role || !canInviteMembers(role)) {
    redirect("/company/dashboard");
  }

  const company = user.membership?.company ?? user.company;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Team management
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {company?.name}
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        Invite colleagues with your company email domain. Buyers can search and
        order with their details pre-filled. Supplier admins can also manage
        inventory.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-700">
          Signed in as <strong>{user.email}</strong>
        </p>
        <LogoutButton className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900" />
      </div>
      <div className="mt-8">
        <CompanyTeamPanel />
      </div>
    </div>
  );
}
