import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { formatWhen } from "@/lib/datetime";
import { getSearchAnalytics } from "@/lib/search-analytics";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { isHumanVisitor, type VisitorLabel } from "@/lib/visitor-classify";

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
  value: string | number;
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

function formatRatio(value: number | null) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function Panel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
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
  const { business, crawl, totals } = analytics;
  const recentHuman = analytics.recent.filter((row) =>
    isHumanVisitor(row.visitorLabel),
  );
  const recentBot = analytics.recent.filter(
    (row) => !isHumanVisitor(row.visitorLabel),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <div>
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
          Business demand and crawl discovery are measured separately. Bot
          volume is an SEO signal — not buyer demand. Visitor labels are
          user-agent based for now; DNS reverse/forward verification for Google
          and Microsoft is planned after several days of UA data.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          All events today: {totals.today} · 7d: {totals.last7Days} · 30d:{" "}
          {totals.last30Days} (includes bots; not a commercial KPI)
        </p>
      </div>

      <Panel
        eyebrow="Business"
        title="Human demand"
        description="Human searches, suppliers, RFQs, and conversion. Keep bots out of these numbers."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Human searches today"
            value={business.humanSearchesToday}
            detail={`${business.humanSearchesLast7Days} in last 7 days`}
          />
          <StatCard label="RFQs submitted today" value={business.rfqsToday} />
          <StatCard
            label="Human search conversion"
            value={formatRatio(business.humanSearchConversion)}
            detail="Submitted RFQs ÷ human searches today"
          />
          <StatCard
            label="Suppliers / returning"
            value={`${business.knownSuppliersToday} / ${business.returningToday}`}
            detail="Known suppliers · returning visitors today"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Human Single / Bulk / Describe"
            value={
              business.byModeHuman30d.single +
              business.byModeHuman30d.bulk +
              business.byModeHuman30d.smart
            }
            detail={`${business.byModeHuman30d.single} · ${business.byModeHuman30d.bulk} · ${business.byModeHuman30d.smart} (30d humans only)`}
          />
          <StatCard
            label="Top human queries"
            value={business.topHumanQueries.length}
            detail="Most common human searches in last 30 days"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Top human queries
          </h3>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Query</th>
                    <th className="px-4 py-3">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {business.topHumanQueries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No human searches logged yet in the last 30 days.
                      </td>
                    </tr>
                  ) : (
                    business.topHumanQueries.map((row) => (
                      <tr
                        key={row.queryText}
                        className="border-b border-slate-50"
                      >
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
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Recent human / supplier searches
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Newest first among humans, returning visitors, and known suppliers.
          </p>
          <RecentTable rows={recentHuman} empty="No human search activity yet." />
        </div>
      </Panel>

      <Panel
        eyebrow="SEO / crawl"
        title="Crawler discovery"
        description="Search-engine and automation traffic. Useful for indexing health — not commercial demand. First review focus: Unknown Scraper IPs and mislabels."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Bot searches today" value={crawl.botSearchesToday} />
          <StatCard
            label="Crawler discovery"
            value={formatRatio(crawl.crawlerDiscovery)}
            detail="UA-claimed Google/Microsoft ÷ total bot searches"
          />
          <StatCard
            label="Google / Microsoft"
            value={`${crawl.googleToday} / ${crawl.microsoftToday}`}
            detail={`${crawl.claimedSearchEngineToday} claimed search-engine crawlers (DNS verify pending)`}
          />
          <StatCard
            label="Meta / unknown scrapers"
            value={`${crawl.metaToday} / ${crawl.unknownScrapersToday}`}
            detail={
              crawl.unclassifiedToday
                ? `${crawl.unclassifiedToday} unclassified today`
                : undefined
            }
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Unknown scraper IPs today
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Review these first for mislabeled humans or abusive automation.
            Rate-limit by behavior later — do not CAPTCHA search or inventory.
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3">Searches today</th>
                  </tr>
                </thead>
                <tbody>
                  {crawl.topUnknownScraperIps.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No unknown scrapers labeled today yet.
                      </td>
                    </tr>
                  ) : (
                    crawl.topUnknownScraperIps.map((row) => (
                      <tr
                        key={row.ipAddress}
                        className="border-b border-slate-50"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-800">
                          {row.ipAddress}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{row.count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Recent bot / unclassified activity
          </h3>
          <RecentTable
            rows={recentBot}
            empty="No bot or unclassified search activity in the recent log."
          />
        </div>
      </Panel>
    </div>
  );
}

function RecentTable({
  rows,
  empty,
}: {
  rows: Awaited<ReturnType<typeof getSearchAnalytics>>["recent"];
  empty: string;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
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
                  <td className="px-4 py-3 text-slate-700">{row.resultCount}</td>
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
  );
}
