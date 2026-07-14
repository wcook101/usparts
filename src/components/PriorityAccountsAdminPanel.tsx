"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  PriorityAccountRecord,
  PriorityAccountSummary,
} from "@/lib/priority-accounts";

type AccountStatus =
  | "NEEDS_RESEARCH"
  | "RESEARCHING"
  | "EMAIL_FOUND"
  | "READY_TO_CONTACT"
  | "CONTACTED"
  | "WON"
  | "LOST";

type FilterKey = "all" | "needs_email" | "has_email" | "ready";

const STATUS_OPTIONS: { value: AccountStatus; label: string }[] = [
  { value: "NEEDS_RESEARCH", label: "Needs research" },
  { value: "RESEARCHING", label: "Researching" },
  { value: "EMAIL_FOUND", label: "Email found" },
  { value: "READY_TO_CONTACT", label: "Ready to contact" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "WON", label: "Won / joined" },
  { value: "LOST", label: "Lost / skip" },
];

const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
  { value: "all", label: "All 25" },
  { value: "needs_email", label: "Needs email" },
  { value: "has_email", label: "Has email" },
  { value: "ready", label: "Ready / contacted" },
];

function statusBadgeClass(status: AccountStatus) {
  switch (status) {
    case "NEEDS_RESEARCH":
      return "bg-slate-100 text-slate-700";
    case "RESEARCHING":
      return "bg-amber-100 text-amber-900";
    case "EMAIL_FOUND":
      return "bg-sky-100 text-sky-800";
    case "READY_TO_CONTACT":
      return "bg-blue-100 text-blue-800";
    case "CONTACTED":
      return "bg-violet-100 text-violet-800";
    case "WON":
      return "bg-green-100 text-green-800";
    case "LOST":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function matchesFilter(record: PriorityAccountRecord, filter: FilterKey) {
  switch (filter) {
    case "needs_email":
      return !record.decisionMakerEmail;
    case "has_email":
      return Boolean(record.decisionMakerEmail);
    case "ready":
      return (
        record.status === "READY_TO_CONTACT" ||
        record.status === "CONTACTED" ||
        record.status === "WON"
      );
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

function websiteHref(website: string | null) {
  if (!website) {
    return null;
  }
  return website.startsWith("http") ? website : `https://${website}`;
}

export function PriorityAccountsAdminPanel() {
  const [records, setRecords] = useState<PriorityAccountRecord[]>([]);
  const [summary, setSummary] = useState<PriorityAccountSummary | null>(null);
  const [filter, setFilter] = useState<FilterKey>("needs_email");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadRecords() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/priority-accounts");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load Top 25 accounts");
      }

      setRecords(data.records as PriorityAccountRecord[]);
      setSummary(data.summary as PriorityAccountSummary);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load Top 25 accounts",
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

  async function updateRecord(id: string, payload: Record<string, unknown>) {
    setError(null);
    setActionId(id);

    try {
      const response = await fetch(`/api/admin/priority-accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update account");
      }

      setRecords((current) =>
        current.map((record) =>
          record.id === id ? (data.record as PriorityAccountRecord) : record,
        ),
      );
      await loadRecords();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update account",
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
          <SummaryCard label="Top accounts" value={summary.total} />
          <SummaryCard label="Needs research" value={summary.needsResearch} />
          <SummaryCard label="Researching" value={summary.researching} />
          <SummaryCard
            label="Emails found"
            value={summary.emailFound}
            detail="Decision-maker email on file"
          />
          <SummaryCard
            label="Ready / contacted"
            value={summary.readyOrContacted}
          />
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Decision-maker research ({filteredRecords.length})
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Dig for the right buyer / owner / inventory lead at each company.
              Capture name, title, and email here before outreach.
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
            No accounts in this view. Try another filter.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredRecords.map((record) => {
              const href = websiteHref(record.website);
              const expanded = expandedId === record.id;

              return (
                <article
                  key={record.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        #{record.rank}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">
                        {record.companyName}
                      </h3>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {record.website}
                        </a>
                      ) : (
                        <p className="text-sm text-slate-400">No website yet</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
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
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : record.id)
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {expanded ? "Collapse" : "Edit research"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                    <p>
                      <span className="text-slate-500">DM: </span>
                      {record.decisionMakerName ?? "—"}
                      {record.decisionMakerTitle
                        ? ` · ${record.decisionMakerTitle}`
                        : ""}
                    </p>
                    <p>
                      <span className="text-slate-500">Email: </span>
                      {record.decisionMakerEmail ? (
                        <a
                          href={`mailto:${record.decisionMakerEmail}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {record.decisionMakerEmail}
                        </a>
                      ) : (
                        <span className="text-amber-700">Still needed</span>
                      )}
                    </p>
                    <p>
                      <span className="text-slate-500">Phone: </span>
                      {record.phone ?? "—"}
                    </p>
                  </div>

                  {expanded ? (
                    <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-slate-600">
                          Website
                        </span>
                        <input
                          defaultValue={record.website ?? ""}
                          disabled={actionId === record.id}
                          onBlur={(event) => {
                            const next = event.target.value.trim();
                            if (next === (record.website ?? "")) return;
                            void updateRecord(record.id, {
                              website: next,
                              status:
                                record.status === "NEEDS_RESEARCH"
                                  ? "RESEARCHING"
                                  : record.status,
                            });
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="company.com"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-slate-600">
                          Decision maker name
                        </span>
                        <input
                          defaultValue={record.decisionMakerName ?? ""}
                          disabled={actionId === record.id}
                          onBlur={(event) => {
                            const next = event.target.value.trim();
                            if (next === (record.decisionMakerName ?? "")) return;
                            void updateRecord(record.id, {
                              decisionMakerName: next,
                              status:
                                record.status === "NEEDS_RESEARCH"
                                  ? "RESEARCHING"
                                  : record.status,
                            });
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Jane Smith"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-slate-600">
                          Title / role
                        </span>
                        <input
                          defaultValue={record.decisionMakerTitle ?? ""}
                          disabled={actionId === record.id}
                          onBlur={(event) => {
                            const next = event.target.value.trim();
                            if (next === (record.decisionMakerTitle ?? "")) return;
                            void updateRecord(record.id, {
                              decisionMakerTitle: next,
                            });
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Owner, VP Sales, Inventory Manager…"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-slate-600">
                          Decision maker email
                        </span>
                        <input
                          type="email"
                          defaultValue={record.decisionMakerEmail ?? ""}
                          disabled={actionId === record.id}
                          onBlur={(event) => {
                            const next = event.target.value.trim();
                            if (next === (record.decisionMakerEmail ?? "")) return;
                            void updateRecord(record.id, {
                              decisionMakerEmail: next,
                            });
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="jane@company.com"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-slate-600">
                          Phone
                        </span>
                        <input
                          defaultValue={record.phone ?? ""}
                          disabled={actionId === record.id}
                          onBlur={(event) => {
                            const next = event.target.value.trim();
                            if (next === (record.phone ?? "")) return;
                            void updateRecord(record.id, { phone: next });
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="555-123-4567"
                        />
                      </label>

                      <label className="block space-y-1">
                        <span className="text-xs font-medium text-slate-600">
                          LinkedIn
                        </span>
                        <input
                          defaultValue={record.linkedInUrl ?? ""}
                          disabled={actionId === record.id}
                          onBlur={(event) => {
                            const next = event.target.value.trim();
                            if (next === (record.linkedInUrl ?? "")) return;
                            void updateRecord(record.id, { linkedInUrl: next });
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="https://linkedin.com/in/…"
                        />
                      </label>

                      <label className="block space-y-1 sm:col-span-2">
                        <span className="text-xs font-medium text-slate-600">
                          Research notes
                        </span>
                        <textarea
                          defaultValue={record.researchNotes ?? ""}
                          rows={3}
                          disabled={actionId === record.id}
                          onBlur={(event) => {
                            const next = event.target.value.trim();
                            if (next === (record.researchNotes ?? "")) return;
                            void updateRecord(record.id, {
                              researchNotes: next,
                              status:
                                record.status === "NEEDS_RESEARCH"
                                  ? "RESEARCHING"
                                  : record.status,
                            });
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          placeholder="Where you found them, gatekeepers, best angle, next step…"
                        />
                      </label>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
