import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { formatWhen } from "@/lib/datetime";
import { getSearchAnalytics } from "@/lib/search-analytics";
import { pageMetadata } from "@/lib/seo/page-metadata";
import type { VisitorLabel } from "@/lib/visitor-classify";

export const metadata = pageMetadata.adminAnalytics;

export const dynamic = "force-dynamic";

function modeLabel(mode: string) {
  if (mode === "BULK") return "Bulk";
  if (mode === "SMART") return "Describe";
  return "Single";
}

function visitorTone(label: VisitorLabel) {
  switch (label) {
    case "Google Search Bot":
    case "Microsoft Search Bot":
    case "Meta AI":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "Unknown Scraper":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    case "Known Supplier":
      return "bg-blue-50 text-blue-800 ring-blue-200";
    case "Returning Visitor":
      return "bg-violet-50 text-violet-800 ring-violet-200";
    case "Human Visitor":
      return "bg-slate-100 text-slate-800 ring-slate-200";
    default:
      return "bg-slate-50 text-slate-600 ring-slate-200";
  }
}

function VisitorBadge({ label }: { label: VisitorLabel }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${visitorTone(label)}`}
    >
      {label}
    </span>
  );
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
  const v = analytics.stats.visitorsToday;

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
          Buyer and crawler demand on your inventory. Search engines querying
          parts is a healthy SEO signal — not noise to ignore.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Searches today" value={analytics.stats.today} />
        <StatCard label="Human searches today" value={v.human} />
        <StatCard label="Bot searches today" value={v.bot} />
        <StatCard
          label="Last 7 days"
          value={analytics.stats.last7Days}
          detail={`${analytics.stats.last30Days} in last 30 days`}
        />
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Google searches" value={v.google} />
        <StatCard label="Microsoft searches" value={v.microsoft} />
        <StatCard label="Meta searches" value={v.meta} />
        <StatCard
          label="Unknown scrapers"
          value={v.unknownScrapers}
          detail={
            v.knownSuppliers || v.returning || v.unclassified
              ? `${v.knownSuppliers} suppliers · ${v.returning} returning · ${v.unclassified} unclassified`
              : undefined
          }
        />
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
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
          Newest first. Visitor type is inferred from user-agent, login, and
          return visits. Result count is how many listings matched.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">When (ET)</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Query</th>
                  <th className="px-4 py-3">Results</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Visitor</th>
                  <th className="px-4 py-3">User</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recent.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
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
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-700">
                        {row.ipAddress ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <VisitorBadge label={row.visitorLabel} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {row.userEmail ?? "—"}
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
