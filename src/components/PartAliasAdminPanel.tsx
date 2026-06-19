"use client";

import { useEffect, useState } from "react";

type PartAliasRecord = {
  id: string;
  fromMpn: string;
  toMpn: string;
  manufacturer: string | null;
  source: string;
  confidence: number;
  createdAt: string;
};

export function PartAliasAdminPanel() {
  const [aliases, setAliases] = useState<PartAliasRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadAliases() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/part-aliases");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load aliases");
      }
      setAliases(data.aliases as PartAliasRecord[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load aliases");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAliases();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/part-aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromMpn: formData.get("fromMpn"),
          toMpn: formData.get("toMpn"),
          manufacturer: formData.get("manufacturer"),
          confidence: formData.get("confidence") || 1,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create alias");
      }

      event.currentTarget.reset();
      await loadAliases();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to create alias",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);

    try {
      const response = await fetch(`/api/admin/part-aliases/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete alias");
      }
      setAliases((current) => current.filter((alias) => alias.id !== id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete alias",
      );
    }
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add alias pair</h2>
        <p className="mt-2 text-sm text-slate-600">
          Part numbers are normalized on save (uppercase, no dashes). Add both directions
          if you want bidirectional matching.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">From MPN (searched)</span>
            <input
              name="fromMpn"
              required
              placeholder="NE555P"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">To MPN (inventory)</span>
            <input
              name="toMpn"
              required
              placeholder="NE555N"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Manufacturer <span className="font-normal text-slate-500">(optional)</span>
            </span>
            <input
              name="manufacturer"
              placeholder="Texas Instruments"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Confidence</span>
            <input
              name="confidence"
              type="number"
              min={0}
              max={1}
              step={0.05}
              defaultValue={1}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "Saving..." : "Add alias"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Active aliases ({aliases.length})
        </h2>

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading...</p>
        ) : aliases.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No aliases configured yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">From</th>
                  <th className="px-3 py-3">To</th>
                  <th className="px-3 py-3">Manufacturer</th>
                  <th className="px-3 py-3">Source</th>
                  <th className="px-3 py-3 text-right">Confidence</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aliases.map((alias) => (
                  <tr key={alias.id}>
                    <td className="px-3 py-3 font-mono">{alias.fromMpn}</td>
                    <td className="px-3 py-3 font-mono">{alias.toMpn}</td>
                    <td className="px-3 py-3">{alias.manufacturer ?? "—"}</td>
                    <td className="px-3 py-3">{alias.source}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {alias.confidence.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDelete(alias.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
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
