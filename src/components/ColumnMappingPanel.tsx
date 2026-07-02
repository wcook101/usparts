"use client";

import { useMemo, useState } from "react";
import {
  buildMappedPreviewRows,
  guessColumnMap,
  guessColumnMapByPosition,
  IMPORT_TARGET_FIELDS,
  stripExcludedMappings,
  type ColumnMap,
  type ImportPreview,
  type ImportTargetField,
} from "@/lib/inventory-import";

type ColumnMappingPanelProps = {
  preview: ImportPreview;
  mapping: ColumnMap;
  excludedColumns: string[];
  onMappingChange: (mapping: ColumnMap) => void;
  onExcludedColumnsChange: (excludedColumns: string[]) => void;
  sampleRows: Record<string, string>[];
};

function removeMappingsForColumn(mapping: ColumnMap, columnKey: string): ColumnMap {
  const next: ColumnMap = {};

  for (const [targetField, sourceKey] of Object.entries(mapping)) {
    if (sourceKey !== columnKey) {
      next[targetField as ImportTargetField] = sourceKey;
    }
  }

  return next;
}

export function ColumnMappingPanel({
  preview,
  mapping,
  excludedColumns,
  onMappingChange,
  onExcludedColumnsChange,
  sampleRows,
}: ColumnMappingPanelProps) {
  const [selectedSourceKey, setSelectedSourceKey] = useState<string | null>(null);
  const excludedSet = useMemo(() => new Set(excludedColumns), [excludedColumns]);
  const activeMapping = useMemo(
    () => stripExcludedMappings(mapping, excludedSet),
    [mapping, excludedSet],
  );

  const reverseMapping = useMemo(() => {
    const reverse: Record<string, ImportTargetField> = {};
    for (const [target, source] of Object.entries(activeMapping)) {
      if (source) {
        reverse[source] = target as ImportTargetField;
      }
    }
    return reverse;
  }, [activeMapping]);

  const includedColumns = useMemo(
    () => preview.columns.filter((column) => !excludedSet.has(column.key)),
    [preview.columns, excludedSet],
  );

  const previewRows = useMemo(
    () =>
      buildMappedPreviewRows(
        sampleRows,
        activeMapping,
        excludedSet,
        preview.columns,
      ),
    [activeMapping, excludedSet, preview.columns, sampleRows],
  );

  function assignSourceToTarget(targetKey: ImportTargetField) {
    if (!selectedSourceKey || excludedSet.has(selectedSourceKey)) return;

    onMappingChange({
      ...mapping,
      [targetKey]: selectedSourceKey,
    });
    setSelectedSourceKey(null);
  }

  function clearTarget(targetKey: ImportTargetField) {
    const next = { ...mapping };
    delete next[targetKey];
    onMappingChange(next);
  }

  function toggleExcluded(columnKey: string) {
    if (excludedSet.has(columnKey)) {
      onExcludedColumnsChange(excludedColumns.filter((key) => key !== columnKey));
      return;
    }

    onExcludedColumnsChange([...excludedColumns, columnKey]);
    onMappingChange(removeMappingsForColumn(mapping, columnKey));

    if (selectedSourceKey === columnKey) {
      setSelectedSourceKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
        <p className="font-medium text-slate-900">How field matching works</p>
        <p className="mt-2 leading-6">
          Click one of your file columns, then click the USParts field it should
          fill. Columns you do not want imported can be excluded with{" "}
          <strong>Exclude column</strong>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              onMappingChange(guessColumnMap(preview.columns, excludedSet))
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Auto-match by header names
          </button>
          <button
            type="button"
            onClick={() =>
              onMappingChange(guessColumnMapByPosition(preview.columns, excludedSet))
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Match column 1 to field 1, column 2 to field 2...
          </button>
        </div>
      </div>

      {!activeMapping.dateCode ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">Date code column not matched</p>
          <p className="mt-2 leading-6">
            If your file has a date code, lot, or D/C column, match it to{" "}
            <strong>Date Code</strong>. Without it, rows with the same part number
            and manufacturer are imported separately only when their date codes
            differ — blank date codes will not be merged together.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Your file columns</h3>
          <p className="mt-1 text-xs text-slate-500">
            {preview.rowCount.toLocaleString()} data rows detected ·{" "}
            {excludedColumns.length > 0
              ? `${excludedColumns.length} excluded`
              : "exclude any column you do not want imported"}
          </p>
          <div className="mt-4 space-y-3">
            {preview.columns.map((column) => {
              const isSelected = selectedSourceKey === column.key;
              const isExcluded = excludedSet.has(column.key);
              const matchedTarget = reverseMapping[column.key];

              return (
                <div
                  key={column.key}
                  className={`rounded-lg border px-4 py-3 transition ${
                    isExcluded
                      ? "border-slate-200 bg-slate-100 opacity-70"
                      : isSelected
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                        : matchedTarget
                          ? "border-green-300 bg-green-50"
                          : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      disabled={isExcluded}
                      onClick={() =>
                        setSelectedSourceKey(isSelected ? null : column.key)
                      }
                      className="flex-1 text-left disabled:cursor-not-allowed"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Column {column.index + 1}
                      </p>
                      <p
                        className={`mt-1 text-sm font-medium text-slate-900 ${
                          isExcluded ? "line-through" : ""
                        }`}
                      >
                        {column.label}
                      </p>
                      {column.samples[0] ? (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          e.g. {column.samples[0]}
                        </p>
                      ) : null}
                    </button>

                    <div className="flex flex-col items-end gap-2">
                      {isExcluded ? (
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                          Excluded
                        </span>
                      ) : matchedTarget ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Matched
                        </span>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => toggleExcluded(column.key)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {isExcluded ? "Include column" : "Exclude column"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">USParts fields</h3>
          <p className="mt-1 text-xs text-slate-500">
            Required fields are marked. Optional fields can be left unmatched.
          </p>
          <div className="mt-4 space-y-3">
            {IMPORT_TARGET_FIELDS.map((field, index) => {
              const mappedSource = activeMapping[field.key];
              const mappedColumn = preview.columns.find(
                (column) => column.key === mappedSource,
              );

              return (
                <div
                  key={field.key}
                  className={`rounded-lg border px-4 py-3 ${
                    mappedSource
                      ? "border-green-300 bg-green-50"
                      : field.required
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => assignSourceToTarget(field.key)}
                      className="flex-1 text-left"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Field {index + 1}
                        {field.required ? " · Required" : " · Optional"}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {field.label}
                      </p>
                      {mappedColumn ? (
                        <p className="mt-1 text-xs text-green-800">
                          Matched to Column {mappedColumn.index + 1}:{" "}
                          {mappedColumn.label}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500">
                          {selectedSourceKey
                            ? "Click to match the selected column"
                            : "Select a file column first"}
                        </p>
                      )}
                    </button>

                    <select
                      value={mappedSource ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (!value) {
                          clearTarget(field.key);
                          return;
                        }
                        onMappingChange({ ...mapping, [field.key]: value });
                      }}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                    >
                      <option value="">Select column</option>
                      {includedColumns.map((column) => (
                        <option key={column.key} value={column.key}>
                          Column {column.index + 1}: {column.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Preview mapped rows</h3>
        <p className="mt-1 text-xs text-slate-500">
          First few rows after your field matching is applied. Excluded columns
          are ignored. Rows with validation issues still show mapped values.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">MPN</th>
                <th className="px-3 py-2">Manufacturer</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Issue</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row) => (
                <tr key={row.rowNumber} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-mono text-blue-700">{row.mpn}</td>
                  <td className="px-3 py-2">{row.manufacturer}</td>
                  <td className="px-3 py-2">{row.quantity}</td>
                  <td className="px-3 py-2">{row.price}</td>
                  <td className="px-3 py-2 text-xs text-amber-700">
                    {row.validationError ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {previewRows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No sample rows were found in this file.
          </p>
        ) : null}
        {previewRows.every(
          (row) => row.mpn === "—" && row.quantity === "—",
        ) ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            No mapped values yet. Match your required fields on the left, or use
            auto-match above.
          </p>
        ) : null}
      </section>
    </div>
  );
}
