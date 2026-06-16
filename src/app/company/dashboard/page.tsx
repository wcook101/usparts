import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { getSessionUser } from "@/lib/auth";
import { canInviteMembers, canManageInventory } from "@/lib/auth/membership";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Supplier Dashboard",
};

export default async function CompanyDashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/company/dashboard");
  }

  const company = user.membership?.company ?? user.company;
  const role = user.membership?.role ?? (user.company ? "OWNER" : null);

  if (!company || !role) {
    redirect("/company");
  }

  const manageInventory = canManageInventory(role);
  const inviteMembers = canInviteMembers(role);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Company dashboard
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {company.name}
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        {manageInventory
          ? "Manage inventory for your company. Buyers can search your parts without signing in."
          : "Search parts and place orders with your company details pre-filled."}
      </p>
      <p className="mt-2 text-sm text-green-800">
        Signed in as {user.email}
        {role === "MEMBER" ? " (buyer)" : role === "ADMIN" ? " (supplier admin)" : " (owner)"}.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-700">
          Account: <strong>{user.email}</strong>
        </p>
        <LogoutButton className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/search"
          className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition hover:border-blue-300"
        >
          <h2 className="text-lg font-semibold text-slate-900">Search parts</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Find components from suppliers across the marketplace.
          </p>
        </Link>
        <Link
          href="/account"
          className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition hover:border-blue-300"
        >
          <h2 className="text-lg font-semibold text-slate-900">Account settings</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Update your display name and reset your password.
          </p>
        </Link>
        <Link
          href="/orders"
          className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition hover:border-blue-300"
        >
          <h2 className="text-lg font-semibold text-slate-900">My orders</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review orders you have placed while signed in.
          </p>
        </Link>
        {manageInventory ? (
          <>
            <Link
              href="/company/inbox"
              className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition hover:border-blue-300"
            >
              <h2 className="text-lg font-semibold text-slate-900">Inbox</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                View incoming orders and quote requests from buyers.
              </p>
            </Link>
            <Link
              href="/company/listings"
              className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition hover:border-blue-300"
            >
              <h2 className="text-lg font-semibold text-slate-900">Manage listings</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Edit quantities, pricing, or deactivate parts individually.
              </p>
            </Link>
            <Link
              href="/company/import"
              className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition hover:border-blue-300"
            >
              <h2 className="text-lg font-semibold text-slate-900">Bulk import</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Upload CSV or Excel files with up to 100,000 parts at once.
              </p>
            </Link>
            <Link
              href="/company/listings/new"
              className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition hover:border-blue-300"
            >
              <h2 className="text-lg font-semibold text-slate-900">Add one part</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Publish a single listing with stock, price, and location details.
              </p>
            </Link>
            <Link
              href="/company/settings"
              className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition hover:border-blue-300 sm:col-span-2"
            >
              <h2 className="text-lg font-semibold text-slate-900">Company settings</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Update your company name, website, phone, and location details.
              </p>
            </Link>
          </>
        ) : null}
        {inviteMembers ? (
          <Link
            href="/company/team"
            className="rounded-xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition hover:border-blue-300 sm:col-span-2"
          >
            <h2 className="text-lg font-semibold text-slate-900">Team & invites</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Invite colleagues with your company email domain. Buyers get pre-filled
              checkout; supplier admins can manage inventory.
            </p>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
