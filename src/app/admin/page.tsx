import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { getAdminOverview } from "@/lib/admin-overview";
import { UPLOAD_EMAIL } from "@/lib/site";

export const metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

function formatWhen(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {detail ? <p className="mt-1 text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        ok
          ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800"
          : "rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800"
      }
    >
      {label}
    </span>
  );
}

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isPlatformAdmin(user.email)) {
    notFound();
  }

  const overview = await getAdminOverview();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Platform admin
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            USParts overview
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Signed in as {user.email}. Monitor new suppliers, accounts, and system
            health.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/search"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Search parts
          </Link>
          <Link
            href="/company/dashboard"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Supplier dashboard
          </Link>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">System health</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <StatusBadge
            ok={overview.health.database}
            label={overview.health.database ? "Database OK" : "Database error"}
          />
          <StatusBadge
            ok={overview.health.emailProvider !== "dev"}
            label={
              overview.health.emailProvider === "dev"
                ? "Email not configured"
                : `Email: ${overview.health.emailProvider}`
            }
          />
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            App URL: {overview.health.appUrl}
          </span>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Email inventory uploads</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Suppliers can email spreadsheets to{" "}
          <span className="font-mono font-medium">{UPLOAD_EMAIL}</span>. Check
          that mailbox in SiteGround webmail, download the attachment, and import
          it through the supplier&apos;s account or your internal process.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Make sure the <strong>{UPLOAD_EMAIL}</strong> mailbox exists in
          SiteGround and is monitored. Match the sender email to a registered
          company when possible.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Companies"
          value={overview.stats.companies}
          detail={`+${overview.stats.companiesLast7Days} last 7 days`}
        />
        <StatCard
          label="Users"
          value={overview.stats.users}
          detail={`+${overview.stats.usersLast7Days} last 7 days`}
        />
        <StatCard label="Active listings" value={overview.stats.activeListings} />
        <StatCard
          label="Orders"
          value={overview.stats.orders}
          detail={`+${overview.stats.ordersLast7Days} last 7 days`}
        />
        <StatCard
          label="Quotes"
          value={overview.stats.quotes}
          detail={`+${overview.stats.quotesLast7Days} last 7 days`}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Recent companies</h2>
        <p className="mt-1 text-sm text-slate-600">
          Newest supplier registrations first.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Locations</th>
                  <th className="px-4 py-3">Listings</th>
                  <th className="px-4 py-3">Last import</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No companies registered yet.
                    </td>
                  </tr>
                ) : (
                  overview.recentCompanies.map((company) => (
                    <tr key={company.id} className="border-b border-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{company.name}</p>
                        <p className="text-slate-500">{company.email}</p>
                        {company.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Website
                          </a>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p>{company.ownerName ?? "—"}</p>
                        <p className="text-slate-500">{company.ownerEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatWhen(company.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {company.locations.length > 0 ? (
                          <ul className="space-y-1">
                            {company.locations.map((location) => (
                              <li key={location}>{location}</li>
                            ))}
                          </ul>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {company.listingCount}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatWhen(company.lastImportAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">
          Accounts without a company
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Users who signed up but have not completed supplier registration.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Signed up</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentUsersWithoutCompany.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      No pending accounts.
                    </td>
                  </tr>
                ) : (
                  overview.recentUsersWithoutCompany.map((account) => (
                    <tr key={account.id} className="border-b border-slate-50">
                      <td className="px-4 py-3 text-slate-700">
                        {account.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{account.email}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatWhen(account.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
