"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CustomerCrmSummary,
  CustomerLeadRecord,
} from "@/lib/customer-crm";
import { formatWhen } from "@/lib/datetime";

type CrmStatus =
  | "LEAD"
  | "CONTACTED"
  | "NURTURING"
  | "SIGNED_UP"
  | "ACTIVE"
  | "LOST"
  | "ARCHIVED";

type FilterKey = "all" | "pipeline" | "customers" | "closed";

const STATUS_OPTIONS: { value: CrmStatus; label: string }[] = [
  { value: "LEAD", label: "New lead" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "NURTURING", label: "Nurturing" },
  { value: "SIGNED_UP", label: "Signed up" },
  { value: "ACTIVE", label: "Active customer" },
  { value: "LOST", label: "Lost" },
  { value: "ARCHIVED", label: "Archived" },
];

const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pipeline", label: "Pipeline" },
  { value: "customers", label: "On platform" },
  { value: "closed", label: "Closed" },
];

const SOURCE_SUGGESTIONS = [
  "Website",
  "Referral",
  "Trade show",
  "Cold outreach",
  "LinkedIn",
  "Other",
];

function formatDate(value: string | null) {
  return formatWhen(value, { time: false });
}

function statusBadgeClass(status: CrmStatus) {
  switch (status) {
    case "LEAD":
      return "bg-sky-100 text-sky-800";
    case "CONTACTED":
      return "bg-blue-100 text-blue-800";
    case "NURTURING":
      return "bg-amber-100 text-amber-900";
    case "SIGNED_UP":
      return "bg-violet-100 text-violet-800";
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "LOST":
      return "bg-red-100 text-red-800";
    case "ARCHIVED":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function matchesFilter(record: CustomerLeadRecord, filter: FilterKey) {
  switch (filter) {
    case "pipeline":
      return (
        record.status === "LEAD" ||
        record.status === "CONTACTED" ||
        record.status === "NURTURING"
      );
    case "customers":
      return record.status === "SIGNED_UP" || record.status === "ACTIVE";
    case "closed":
      return record.status === "LOST" || record.status === "ARCHIVED";
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

export function CustomerCrmAdminPanel() {
  const [records, setRecords] = useState<CustomerLeadRecord[]>([]);
  const [summary, setSummary] = useState<CustomerCrmSummary | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [emailLeadId, setEmailLeadId] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState(
    "US Parts — free electronic component search",
  );
  const [emailMessage, setEmailMessage] = useState(
    "Quick note to share US Parts (www.usparts.us) — a free marketplace to search electronic components from independent distributors. Happy to walk you through it if useful.",
  );
  const createFormRef = useRef<HTMLFormElement>(null);

  async function loadRecords() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/customer-crm");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load customer CRM");
      }

      setRecords(data.records as CustomerLeadRecord[]);
      setSummary(data.summary as CustomerCrmSummary);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load customer CRM",
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
      const response = await fetch("/api/admin/customer-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          companyName: formData.get("companyName"),
          phone: formData.get("phone"),
          source: formData.get("source"),
          contactedAt: formData.get("contactedAt")
            ? new Date(String(formData.get("contactedAt"))).toISOString()
            : undefined,
          notes: formData.get("notes"),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to add lead");
      }

      createFormRef.current?.reset();
      await loadRecords();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to add lead",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateRecord(id: string, payload: Record<string, unknown>) {
    setError(null);
    setActionId(id);

    try {
      const response = await fetch(`/api/admin/customer-crm/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update lead");
      }

      setRecords((current) =>
        current.map((record) =>
          record.id === id ? (data.record as CustomerLeadRecord) : record,
        ),
      );
      await loadRecords();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Failed to update lead",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setActionId(id);

    try {
      const response = await fetch(`/api/admin/customer-crm/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete lead");
      }

      setRecords((current) => current.filter((record) => record.id !== id));
      await loadRecords();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete lead",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleSendEmail(id: string) {
    setError(null);
    setActionId(id);

    try {
      const response = await fetch(`/api/admin/customer-crm/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sendEmail: true,
          subject: emailSubject,
          message: emailMessage,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send email");
      }

      setEmailLeadId(null);
      await loadRecords();
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : "Failed to send email",
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
            label="In pipeline"
            value={summary.pipeline}
            detail="Lead / contacted / nurturing"
          />
          <SummaryCard label="Signed up" value={summary.signedUp} />
          <SummaryCard label="Active" value={summary.active} />
          <SummaryCard label="Closed" value={summary.closed} />
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add a customer lead</h2>
        <p className="mt-2 text-sm text-slate-600">
          Track buyers and prospects you want to market. When their email matches a
          signup, the lead links automatically.
        </p>

        <form
          ref={createFormRef}
          onSubmit={handleCreate}
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              name="name"
              placeholder="Jane Smith"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="jane@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Company</span>
            <input
              name="companyName"
              placeholder="Acme Manufacturing"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <input
              name="phone"
              placeholder="555-123-4567"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Source</span>
            <input
              name="source"
              list="crm-source-suggestions"
              placeholder="Referral, trade show…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <datalist id="crm-source-suggestions">
              {SOURCE_SUGGESTIONS.map((source) => (
                <option key={source} value={source} />
              ))}
            </datalist>
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
              placeholder="How you met them, what they need, next steps…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Saving..." : "Add to CRM"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Customer pipeline ({filteredRecords.length})
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Market prospects, log follow-ups, and track who signs up.
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

        {emailLeadId ? (
          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              Send email to{" "}
              {records.find((record) => record.id === emailLeadId)?.email}
            </p>
            <div className="mt-3 grid gap-3">
              <input
                value={emailSubject}
                onChange={(event) => setEmailSubject(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Subject"
              />
              <textarea
                value={emailMessage}
                onChange={(event) => setEmailMessage(event.target.value)}
                rows={5}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Message"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={actionId === emailLeadId}
                  onClick={() => void handleSendEmail(emailLeadId)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
                >
                  {actionId === emailLeadId ? "Sending…" : "Send email"}
                </button>
                <button
                  type="button"
                  onClick={() => setEmailLeadId(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No customer leads in this view yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Company</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Contacted</th>
                  <th className="px-3 py-3">Marketing</th>
                  <th className="px-3 py-3">Account</th>
                  <th className="px-3 py-3">Notes</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-3 py-3 align-top">
                      <p className="font-medium text-slate-900">
                        {record.name ?? "—"}
                      </p>
                      <p className="text-slate-500">{record.email}</p>
                      {record.phone ? (
                        <p className="text-xs text-slate-500">{record.phone}</p>
                      ) : null}
                      {record.source ? (
                        <p className="mt-1 text-xs text-slate-400">
                          Source: {record.source}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 align-top text-slate-700">
                      {record.companyName ?? "—"}
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
                          {record.emailCount > 0
                            ? `${record.emailCount} sent · last ${formatDate(record.lastEmailedAt)}`
                            : "No emails yet"}
                        </p>
                        <button
                          type="button"
                          disabled={actionId === record.id}
                          onClick={() => setEmailLeadId(record.id)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400"
                        >
                          Email prospect
                        </button>
                        <button
                          type="button"
                          disabled={actionId === record.id}
                          onClick={() =>
                            void updateRecord(record.id, {
                              status: "NURTURING",
                              lastFollowUpAt: new Date().toISOString(),
                            })
                          }
                          className="block text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400"
                        >
                          Mark follow-up today
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top text-slate-700">
                      {record.user ? (
                        <div className="space-y-1">
                          <p className="font-medium text-green-700">Signed up</p>
                          <p className="text-xs text-slate-500">
                            {formatDate(record.user.createdAt)}
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
