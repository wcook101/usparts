"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  AdminRfqActivityRecord,
  AdminRfqSummary,
} from "@/lib/admin-rfqs";
import { formatWhen } from "@/lib/datetime";

type FilterKey = "all" | "single" | "bulk";

const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
  { value: "all", label: "All RFQs" },
  { value: "single", label: "Single part" },
  { value: "bulk", label: "Bulk / BOM" },
];

function statusBadgeClass(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-900";
    case "SENDING":
      return "bg-blue-100 text-blue-800";
    case "COMPLETED":
    case "CONFIRMED":
    case "FULFILLED":
      return "bg-green-100 text-green-800";
    case "FAILED":
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function matchesFilter(record: AdminRfqActivityRecord, filter: FilterKey) {
  if (filter === "all") {
    return true;
  }

  return record.kind === filter;
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {detail ? <p className="mt-1 text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}

function RfqDetails({ record }: { record: AdminRfqActivityRecord }) {
  if (record.kind === "bulk") {
    return (
      <div className="space-y-2">
        <p className="font-medium text-slate-900">
          {record.totalListings} part{record.totalListings === 1 ? "" : "s"} ·{" "}
          {record.totalVendors} supplier
          {record.totalVendors === 1 ? "" : "s"} · {record.emailsSent} email
          {record.emailsSent === 1 ? "" : "s"} sent
        </p>
        {record.lines.length > 0 ? (
          <ul className="space-y-2">
            {record.lines.map((line) => (
              <li key={line.listingId} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="font-mono font-medium text-slate-900">{line.mpn}</p>
                <p className="text-slate-600">
                  {line.manufacturer ?? "Unknown manufacturer"} · Qty{" "}
                  {line.quantity}
                </p>
                <p className="text-slate-600">
                  To: {line.supplierName} ({line.supplierEmail})
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">
            Line-item details are unavailable for this older bulk RFQ.
          </p>
        )}
        {record.errorMessage ? (
          <p className="text-red-700">{record.errorMessage}</p>
        ) : null}
        {record.notes ? (
          <p className="text-slate-500">Notes: {record.notes}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="font-mono font-medium text-slate-900">{record.mpn}</p>
      <p className="text-slate-600">
        {record.manufacturer ?? "Unknown manufacturer"} · Qty {record.quantity}
      </p>
      <p className="text-slate-600">
        To: {record.supplierName} ({record.supplierEmail})
      </p>
      {record.notes ? (
        <p className="text-slate-500">Notes: {record.notes}</p>
      ) : null}
    </div>
  );
}

export function RfqAdminPanel() {
  const [records, setRecords] = useState<AdminRfqActivityRecord[]>([]);
  const [summary, setSummary] = useState<AdminRfqSummary | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/admin/rfqs");
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load RFQ activity");
        }

        if (!cancelled) {
          setRecords(payload.records ?? []);
          setSummary(payload.summary ?? null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load RFQ activity",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecords = useMemo(
    () => records.filter((record) => matchesFilter(record, filter)),
    [records, filter],
  );

  return (
    <div className="space-y-8">
      {summary ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Single-part RFQs"
            value={summary.totalSingle}
            detail={`+${summary.last7DaysSingle} last 7 days`}
          />
          <SummaryCard
            label="Bulk RFQs"
            value={summary.totalBulk}
            detail={`+${summary.last7DaysBulk} last 7 days`}
          />
          <SummaryCard
            label="Last 30 days"
            value={summary.last30DaysSingle + summary.last30DaysBulk}
            detail={`${summary.last30DaysSingle} single · ${summary.last30DaysBulk} bulk`}
          />
          <SummaryCard
            label="All time"
            value={summary.totalSingle + summary.totalBulk}
            detail="Submitted from www.usparts.us"
          />
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">RFQ activity</h2>
            <p className="mt-1 text-sm text-slate-600">
              Every quote request submitted from the site, newest first.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={
                  filter === option.value
                    ? "rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
                    : "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <p className="mt-6 text-sm text-slate-500">Loading RFQ activity…</p>
        ) : filteredRecords.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-900">No RFQs yet</p>
            <p className="mt-2 text-sm text-slate-600">
              When a buyer requests a quote from a part page or sends a bulk RFQ,
              it will show up here with buyer details, part info, and send time.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Sent</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">Request</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={`${record.kind}-${record.id}`} className="border-b border-slate-50 align-top">
                      <td className="px-4 py-4 text-slate-700">
                        {formatWhen(record.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {record.kind === "bulk" ? "Bulk / BOM" : "Single part"}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        <p className="font-medium text-slate-900">
                          {record.buyerName}
                        </p>
                        <p>{record.buyerEmail}</p>
                        {record.buyerCompany ? (
                          <p className="text-slate-500">{record.buyerCompany}</p>
                        ) : null}
                        {record.userId ? (
                          <p className="mt-1 text-xs text-slate-500">Signed-in buyer</p>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">Guest buyer</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        <RfqDetails record={record} />
                        {record.kind === "single" ? (
                          <Link
                            href={`/parts/${encodeURIComponent(record.mpn)}`}
                            className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            View part page
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(record.status)}`}
                        >
                          {statusLabel(record.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
