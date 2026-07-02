"use client";

import { useMemo } from "react";
import {
  buildSkippedRowsCsv,
  type SkippedImportRow,
} from "@/lib/import-listing-key";

type ImportSkippedRowsPanelProps = {
  skippedRows: SkippedImportRow[];
  skippedRowCount: number;
  fileName?: string;
};

const REASON_LABELS: Record<SkippedImportRow["reason"], string> = {
  ignored: "Skipped",
  error: "Error",
  merged: "Duplicate",
};

export function ImportSkippedRowsPanel({
  skippedRows,
  skippedRowCount,
  fileName = "import",
}: ImportSkippedRowsPanelProps) {
  const truncated = skippedRowCount > skippedRows.length;

  const downloadName = useMemo(() => {
    const base = fileName.replace(/\.[^.]+$/, "") || "import";
    return `${base}-not-imported.csv`;
  }, [fileName]);

  function handleDownload() {
    const csv = buildSkippedRowsCsv(skippedRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (skippedRowCount === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Rows not imported</p>
          <p className="mt-1 text-sm text-slate-600">
            {skippedRowCount.toLocaleString()} row
            {skippedRowCount === 1 ? "" : "s"} were skipped, had errors, or were
            exact duplicates of another row in the file.
          </p>
          {truncated ? (
            <p className="mt-1 text-xs text-slate-500">
              Showing the first {skippedRows.length.toLocaleString()} below. Download
              the CSV for the same sample shown here.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Download CSV
        </button>
      </div>

      <div className="mt-4 max-h-80 overflow-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Row</th>
              <th className="px-3 py-2">Reason</th>
              <th className="px-3 py-2">Part</th>
              <th className="px-3 py-2">Manufacturer</th>
              <th className="px-3 py-2">Date code</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Kept row</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {skippedRows.map((row) => (
              <tr key={`${row.reason}-${row.rowNumber}-${row.keptRowNumber ?? ""}`}>
                <td className="px-3 py-2 text-slate-900">{row.rowNumber}</td>
                <td className="px-3 py-2 text-slate-700">
                  {REASON_LABELS[row.reason]}
                </td>
                <td className="px-3 py-2 text-slate-900">{row.mpn || "—"}</td>
                <td className="px-3 py-2 text-slate-700">
                  {row.manufacturer || "—"}
                </td>
                <td className="px-3 py-2 text-slate-700">{row.dateCode || "—"}</td>
                <td className="px-3 py-2 text-slate-700">{row.quantity || "—"}</td>
                <td className="px-3 py-2 text-slate-700">{row.price || "—"}</td>
                <td className="px-3 py-2 text-slate-700">
                  {row.keptRowNumber ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
