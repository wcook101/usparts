import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchIntelRunButton } from "@/components/SearchIntelRunButton";
import { getSessionUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { formatWhen } from "@/lib/datetime";
import { getSearchIntelReport } from "@/lib/search-intel/queries";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.adminSearchIntel;

export const dynamic = "force-dynamic";

function formatDay(value: Date) {
  return formatWhen(value, { time: false });
}

function formatPct(value: { toNumber?: () => number } | number | null) {
  if (value == null) return "—";
  const n = typeof value === "number" ? value : value.toNumber?.() ?? Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

export default async function AdminSearchIntelPage() {
  const user = await getSessionUser();
  if (!user) notFound();
  if (!isPlatformAdmin(user.email)) notFound();

  const report = await getSearchIntelReport({ limitPerDimension: 25 });

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to admin
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Demand intelligence
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Search warehouse
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Nightly rollups of what buyers and crawlers are looking for — the
            raw material for supplier recruiting and future public demand
            reports. Classifier stays frozen; bots and humans stay separated.
          </p>
        </div>
        <SearchIntelRunButton />
      </div>

      {!report ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-6 text-sm text-amber-950">
          No warehouse snapshots yet. Click <strong>Build / refresh rollups</strong>{" "}
          to aggregate existing SearchEvent history, or wait for the nightly cron.
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Snapshot day"
              value={formatDay(report.day.day)}
              detail={`Built ${formatWhen(report.day.builtAt)}`}
            />
            <Stat
              label="Human searches"
              value={String(report.day.searchesHuman)}
              detail={`${report.day.searchesBot} bot · ${report.day.searchesTotal} total`}
            />
            <Stat
              label="Zero-result human"
              value={String(report.day.zeroResultHuman)}
              detail="Demand with no matching inventory that day"
            />
            <Stat
              label="RFQ conversion"
              value={formatPct(report.day.humanSearchConversion)}
              detail={`${report.day.rfqsSubmitted} RFQs ÷ human searches`}
            />
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent daily snapshots
            </h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Human</th>
                    <th className="px-4 py-3">Bot</th>
                    <th className="px-4 py-3">Zero-result</th>
                    <th className="px-4 py-3">RFQs</th>
                    <th className="px-4 py-3">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {report.recentDays.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50">
                      <td className="px-4 py-3 text-slate-800">
                        {formatDay(row.day)}
                      </td>
                      <td className="px-4 py-3">{row.searchesHuman}</td>
                      <td className="px-4 py-3">{row.searchesBot}</td>
                      <td className="px-4 py-3">{row.zeroResultHuman}</td>
                      <td className="px-4 py-3">{row.rfqsSubmitted}</td>
                      <td className="px-4 py-3">
                        {formatPct(row.humanSearchConversion)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {report.sections.map((section) => (
            <section key={section.dimension}>
              <h2 className="text-lg font-semibold text-slate-900">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Top {section.rows.length} for {formatDay(report.day.day)}. Full
                top-100 stored in the warehouse for each night.
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Human</th>
                        <th className="px-4 py-3">Bot</th>
                        <th className="px-4 py-3">Zero-result</th>
                        <th className="px-4 py-3">RFQs</th>
                        <th className="px-4 py-3">Listings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-8 text-center text-slate-500"
                          >
                            No rows for this dimension on this day.
                          </td>
                        </tr>
                      ) : (
                        section.rows.map((row) => (
                          <tr key={row.id} className="border-b border-slate-50">
                            <td className="px-4 py-3 text-slate-500">
                              {row.rank}
                            </td>
                            <td className="max-w-md px-4 py-3 font-mono text-xs text-slate-800">
                              <span className="line-clamp-2 break-all">
                                {row.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">{row.humanCount}</td>
                            <td className="px-4 py-3">{row.botCount}</td>
                            <td className="px-4 py-3">{row.zeroResultCount}</td>
                            <td className="px-4 py-3">{row.rfqCount}</td>
                            <td className="px-4 py-3">{row.listingCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {detail ? <p className="mt-1 text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}
