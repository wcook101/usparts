import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { getSearchAnalytics } from "@/lib/search-analytics";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.adminAnalytics;

export const dynamic = "force-dynamic";

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function modeLabel(mode: string) {
  if (mode === "BULK") return "Bulk";
  if (mode === "SMART") return "Describe";
  return "Single";
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

export default async function AdminAnalyticsPage() {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  if (!isPlatformAdmin(user.email)) {
    notFound();
  }

  const analytics = await getSearchAnalytics();

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
          Site usage
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Search activity
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          See whether buyers are searching the site — recent queries, volume over
          time, and which search modes they use. Logging starts from when this
          feature was deployed.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Searches today" value={analytics.stats.today} />
        <StatCard
          label="Last 7 days"
          value={analytics.stats.last7Days}
          detail={`${analytics.stats.last30Days} in last 30 days`}
        />
        <StatCard
          label="Single / Bulk / Describe"
          value={
            analytics.stats.byMode.single +
            analytics.stats.byMode.bulk +
            analytics.stats.byMode.smart
          }
          detail={`${analytics.stats.byMode.single} · ${analytics.stats.byMode.bulk} · ${analytics.stats.byMode.smart} (30d)`}
        />
        <StatCard
          label="Unique top queries"
          value={analytics.topQueries.length}
          detail="Most common in last 30 days"
        />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Top queries</h2>
        <p className="mt-1 text-sm text-slate-600">
          Most frequent search text in the last 30 days.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Query</th>
                  <th className="px-4 py-3">Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topQueries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No searches logged yet. Once buyers search parts, they will
                      show up here.
                    </td>
                  </tr>
                ) : (
                  analytics.topQueries.map((row) => (
                    <tr key={row.queryText} className="border-b border-slate-50">
                      <td className="max-w-xl px-4 py-3 font-mono text-xs text-slate-800">
                        <span className="line-clamp-2 break-all">
                          {row.queryText}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Recent searches</h2>
        <p className="mt-1 text-sm text-slate-600">
          Newest first. Result count is how many listings matched.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Query</th>
                  <th className="px-4 py-3">Results</th>
                  <th className="px-4 py-3">User</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recent.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No search activity yet.
                    </td>
                  </tr>
                ) : (
                  analytics.recent.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {formatWhen(row.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {modeLabel(row.mode)}
                      </td>
                      <td className="max-w-md px-4 py-3 font-mono text-xs text-slate-800">
                        <span className="line-clamp-2 break-all">
                          {row.queryText}
                        </span>
                        {row.queriedCount != null ? (
                          <span className="mt-1 block text-slate-500">
                            {row.queriedCount} part
                            {row.queriedCount === 1 ? "" : "s"} queried
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.resultCount}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {row.userEmail ?? "Anonymous"}
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
