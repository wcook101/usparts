"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  SupplierOutreachRecord,
  SupplierOutreachSummary,
} from "@/lib/supplier-outreach";
import { formatWhen } from "@/lib/datetime";

type OutreachStatus =
  | "CONTACTED"
  | "FOLLOW_UP"
  | "REGISTERED"
  | "INVENTORY_LIVE"
  | "DECLINED"
  | "ARCHIVED";

type FilterKey = "all" | "awaiting" | "on_platform" | "closed";

const STATUS_OPTIONS: { value: OutreachStatus; label: string }[] = [
  { value: "CONTACTED", label: "Asked to join" },
  { value: "FOLLOW_UP", label: "Follow-up sent" },
  { value: "REGISTERED", label: "Joined USParts" },
  { value: "INVENTORY_LIVE", label: "Inventory live" },
  { value: "DECLINED", label: "Declined" },
  { value: "ARCHIVED", label: "Archived" },
];

const PROSPECT_IMPORT_LIST: {
  companyName: string;
  website?: string;
}[] = [
  { companyName: "Smith", website: "smith.com" },
  { companyName: "NewPower Worldwide", website: "newpower.com" },
  { companyName: "Rand Technology", website: "randtechnology.com" },
  { companyName: "Velocity Electronics" },
  { companyName: "Sourceability", website: "sourceability.com" },
  { companyName: "Classic Components Corporation" },
  { companyName: "A2 Global Electronics + Solutions", website: "a2global.com" },
  { companyName: "Direct Components" },
  { companyName: "Freedom USA" },
  { companyName: "C Plus Electronics" },
  { companyName: "CTrends" },
  { companyName: "Microchip USA" },
  { companyName: "Component Electronics Inc." },
  { companyName: "ASAP Semiconductor" },
  { companyName: "Megastar Electroniques Inc." },
  { companyName: "Abacus Technologies" },
  { companyName: "4 Star Electronics" },
  { companyName: "Eagle Technology Solutions" },
  { companyName: "Serendipity Electronics" },
  { companyName: "Electronic Expediters" },
  { companyName: "Chip Stock LLC" },
  { companyName: "NetSource Technology" },
  { companyName: "VRG Components, Inc" },
  { companyName: "Inland Empire Components, Inc." },
  { companyName: "Baxter Electronics" },
];

const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
  { value: "all", label: "All" },
  { value: "awaiting", label: "Awaiting response" },
  { value: "on_platform", label: "On platform" },
  { value: "closed", label: "Closed" },
];

function formatDate(value: string | null) {
  return formatWhen(value, { time: false });
}

function statusBadgeClass(status: OutreachStatus) {
  switch (status) {
    case "CONTACTED":
      return "bg-blue-100 text-blue-800";
    case "FOLLOW_UP":
      return "bg-amber-100 text-amber-900";
    case "REGISTERED":
      return "bg-violet-100 text-violet-800";
    case "INVENTORY_LIVE":
      return "bg-green-100 text-green-800";
    case "DECLINED":
      return "bg-red-100 text-red-800";
    case "ARCHIVED":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function matchesFilter(record: SupplierOutreachRecord, filter: FilterKey) {
  switch (filter) {
    case "awaiting":
      return record.status === "CONTACTED" || record.status === "FOLLOW_UP";
    case "on_platform":
      return record.status === "REGISTERED" || record.status === "INVENTORY_LIVE";
    case "closed":
      return record.status === "DECLINED" || record.status === "ARCHIVED";
    default:
      return true;
  }
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

export function SupplierOutreachAdminPanel() {
  const [records, setRecords] = useState<SupplierOutreachRecord[]>([]);
  const [summary, setSummary] = useState<SupplierOutreachSummary | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportingProspects, setIsImportingProspects] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const createFormRef = useRef<HTMLFormElement>(null);

  async function loadRecords() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/supplier-outreach");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load outreach records");
      }

      setRecords(data.records as SupplierOutreachRecord[]);
      setSummary(data.summary as SupplierOutreachSummary);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load outreach records",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, []);

  const filteredRecords = useMemo(
    () => records.filter((record) => matchesFilter(record, filter)),
    [records, filter],
  );

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = createFormRef.current;
    if (!form) {
      return;
    }

    const formData = new FormData(form);
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/supplier-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.get("companyName"),
          contactName: formData.get("contactName"),
          contactEmail: formData.get("contactEmail"),
          website: formData.get("website"),
          contactedAt: formData.get("contactedAt")
            ? new Date(String(formData.get("contactedAt"))).toISOString()
            : undefined,
          notes: formData.get("notes"),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to add outreach record");
      }

      createFormRef.current?.reset();
      await loadRecords();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to add outreach record",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImportProspects() {
    setError(null);
    setIsImportingProspects(true);

    try {
      const existingNames = new Set(
        records.map((record) => record.companyName.trim().toLowerCase()),
      );
      let created = 0;
      let skipped = 0;

      for (const prospect of PROSPECT_IMPORT_LIST) {
        const key = prospect.companyName.trim().toLowerCase();
        if (existingNames.has(key)) {
          skipped += 1;
          continue;
        }

        const response = await fetch("/api/admin/supplier-outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: prospect.companyName,
            website: prospect.website ?? "",
            notes:
              "Imported prospect list (Jul 2026). Distributor / supplier outreach candidate.",
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.error ?? `Failed to import ${prospect.companyName}`,
          );
        }

        existingNames.add(key);
        created += 1;
      }

      await loadRecords();
      if (created === 0 && skipped > 0) {
        setError(null);
        window.alert(`All ${skipped} prospects were already in the tracker.`);
      } else {
        window.alert(
          `Imported ${created} prospect${created === 1 ? "" : "s"}${
            skipped ? ` (${skipped} already tracked)` : ""
          }.`,
        );
      }
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Failed to import prospects",
      );
    } finally {
      setIsImportingProspects(false);
    }
  }

  async function updateRecord(
    id: string,
    payload: Record<string, unknown>,
  ) {
    setError(null);
    setActionId(id);

    try {
      const response = await fetch(`/api/admin/supplier-outreach/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update record");
      }

      setRecords((current) =>
        current.map((record) =>
          record.id === id ? (data.record as SupplierOutreachRecord) : record,
        ),
      );
      await loadRecords();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Failed to update record",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setActionId(id);

    try {
      const response = await fetch(`/api/admin/supplier-outreach/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete record");
      }

      setRecords((current) => current.filter((record) => record.id !== id));
      await loadRecords();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete record",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {summary ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard label="Total tracked" value={summary.total} />
          <SummaryCard
            label="Awaiting response"
            value={summary.awaitingResponse}
            detail="Asked or follow-up sent"
          />
          <SummaryCard label="Registered" value={summary.registered} />
          <SummaryCard
            label="Inventory live"
            value={summary.inventoryLive}
            detail="Uploaded stock"
          />
          <SummaryCard label="Closed" value={summary.closed} />
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Log a supplier outreach</h2>
            <p className="mt-2 text-sm text-slate-600">
              Add a prospect when you ask them to join USParts and upload inventory. If
              their contact email matches a registered company, the record links
              automatically and status updates when they import stock.
            </p>
          </div>
          <button
            type="button"
            disabled={isImportingProspects || isLoading}
            onClick={() => void handleImportProspects()}
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isImportingProspects
              ? "Importing…"
              : "Import 25 distributor prospects"}
          </button>
        </div>

        <form
          ref={createFormRef}
          onSubmit={handleCreate}
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Company name</span>
            <input
              name="companyName"
              required
              placeholder="Acme Components"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Contact name</span>
            <input
              name="contactName"
              placeholder="Jane Smith"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Contact email</span>
            <input
              name="contactEmail"
              type="email"
              placeholder="jane@acmecomponents.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Website</span>
            <input
              name="website"
              placeholder="acmecomponents.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Date contacted</span>
            <input
              name="contactedAt"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Notes</span>
            <textarea
              name="notes"
              rows={3}
              placeholder="How you reached out, who you spoke with, next steps..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Saving..." : "Add to tracker"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Outreach pipeline ({filteredRecords.length})
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Track follow-ups and see who has joined or uploaded inventory.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  filter === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No outreach records in this view yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Company</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Contacted</th>
                  <th className="px-3 py-3">Follow-up</th>
                  <th className="px-3 py-3">Platform</th>
                  <th className="px-3 py-3">Notes</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-3 py-3 align-top">
                      <p className="font-medium text-slate-900">{record.companyName}</p>
                      {record.website ? (
                        <a
                          href={
                            record.website.startsWith("http")
                              ? record.website
                              : `https://${record.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {record.website}
                        </a>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 align-top text-slate-700">
                      <p>{record.contactName ?? "—"}</p>
                      <p className="text-slate-500">{record.contactEmail ?? "—"}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <select
                        value={record.status}
                        disabled={actionId === record.id}
                        onChange={(event) =>
                          void updateRecord(record.id, {
                            status: event.target.value,
                          })
                        }
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${statusBadgeClass(record.status)}`}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 align-top text-slate-700">
                      {formatDate(record.contactedAt)}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="space-y-2">
                        <p className="text-slate-700">
                          {formatDate(record.lastFollowUpAt)}
                        </p>
                        <button
                          type="button"
                          disabled={actionId === record.id}
                          onClick={() =>
                            void updateRecord(record.id, {
                              status: "FOLLOW_UP",
                              lastFollowUpAt: new Date().toISOString(),
                            })
                          }
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400"
                        >
                          Mark follow-up today
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top text-slate-700">
                      {record.company ? (
                        <div className="space-y-1">
                          <Link
                            href="/admin/import"
                            className="font-medium text-blue-600 hover:text-blue-700"
                          >
                            {record.company.name}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {record.company.listingCount} active listings
                            {record.company.lastImportAt
                              ? ` · last import ${formatDate(record.company.lastImportAt)}`
                              : ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-500">Not registered</span>
                      )}
                    </td>
                    <td className="max-w-xs px-3 py-3 align-top text-slate-700">
                      <textarea
                        defaultValue={record.notes ?? ""}
                        rows={2}
                        placeholder="Add notes..."
                        onBlur={(event) => {
                          const nextNotes = event.target.value.trim();
                          if (nextNotes === (record.notes ?? "")) {
                            return;
                          }
                          void updateRecord(record.id, {
                            notes: nextNotes,
                          });
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                    <td className="px-3 py-3 align-top text-right">
                      <button
                        type="button"
                        disabled={actionId === record.id}
                        onClick={() => void handleDelete(record.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:text-slate-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
