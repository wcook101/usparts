"use client";

import { useState, useTransition } from "react";

export function SearchIntelRunButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/search-intel/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeToday: true }),
      });
      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        days?: number;
        error?: string;
      } | null;

      if (!response.ok || !data?.ok) {
        setMessage(data?.error ?? "Rollup failed");
        return;
      }

      setMessage(`Built ${data.days ?? 0} day(s). Reloading…`);
      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Building…" : "Build / refresh rollups"}
      </button>
      {message ? (
        <p className="max-w-xs text-right text-xs text-slate-600">{message}</p>
      ) : null}
    </div>
  );
}
