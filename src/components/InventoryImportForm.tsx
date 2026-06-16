"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnMappingPanel } from "@/components/ColumnMappingPanel";
import { formatInventoryLocation } from "@/lib/format";
import {
  formatImportCooldownMessage,
  getImportCooldownStatus,
  MAX_IMPORT_ROWS,
} from "@/lib/import-limits";
import {
  createImportUploadFile,
  isSupportedImportFileName,
  readImportFileBytes,
  supportedImportAcceptAttribute,
  supportedImportFormatsLabel,
  type ImportFileFormat,
} from "@/lib/import-file";
import {
  parseImportContent,
  resolvePreviewRows,
  stripExcludedMappings,
  validateColumnMap,
  type ColumnMap,
  type ImportPreview,
} from "@/lib/inventory-import";

type InventoryLocationOption = {
  id: string;
  label: string | null;
  city: string;
  state: string | null;
  country: string;
};

type CompanyOption = {
  id: string;
  name: string;
  lastImportAt: string | null;
  inventoryLocations: InventoryLocationOption[];
};

type ImportResult = {
  format: ImportFileFormat;
  mode: "append" | "replace";
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  ignoredRows?: number;
  errors: { rowNumber: number; message: string }[];
  lastImportAt: string | null;
};

type InventoryImportFormProps = {
  companies: CompanyOption[];
};

type ImportFileState = {
  name: string;
  bytes: Uint8Array;
  type: string;
};

type WizardStep = "setup" | "mapping" | "done";

export function InventoryImportForm({ companies }: InventoryImportFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("setup");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [defaultLocationId, setDefaultLocationId] = useState("");
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [file, setFile] = useState<File | null>(null);
  const [importFile, setImportFile] = useState<ImportFileState | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [sampleRows, setSampleRows] = useState<Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap>({});
  const [excludedColumns, setExcludedColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [companyLastImportAt, setCompanyLastImportAt] = useState<
    Record<string, string | null>
  >({});
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (companies.length === 1) {
      setSelectedCompanyId(companies[0].id);
      const firstLocation = companies[0].inventoryLocations[0];
      if (firstLocation) {
        setDefaultLocationId(firstLocation.id);
      }
    }
  }, [companies]);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId),
    [companies, selectedCompanyId],
  );

  const effectiveLastImportAt =
    selectedCompanyId in companyLastImportAt
      ? companyLastImportAt[selectedCompanyId]
      : selectedCompany?.lastImportAt ?? null;

  const importCooldown = useMemo(
    () => getImportCooldownStatus(effectiveLastImportAt),
    [effectiveLastImportAt],
  );

  const cooldownMessage = formatImportCooldownMessage(importCooldown);
  const importBlocked = !importCooldown.allowed;

  async function handlePrepareMapping(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError(`Choose a ${supportedImportFormatsLabel()} file to import`);
      return;
    }

    if (!isSupportedImportFileName(file.name)) {
      setError(`Only ${supportedImportFormatsLabel()} files are supported`);
      return;
    }

    if (importBlocked) {
      setError(cooldownMessage);
      return;
    }

    setIsLoadingPreview(true);

    try {
      const bytes = await readImportFileBytes(file);
      const parsed = parseImportContent(file.name, bytes);
      const fileState: ImportFileState = {
        name: file.name,
        bytes,
        type: file.type,
      };

      if (parsed.rows.length === 0) {
        throw new Error("The import file did not contain any data rows");
      }

      const response = await fetch("/api/listings/import/preview", {
        method: "POST",
        body: (() => {
          const formData = new FormData();
          formData.append("file", createImportUploadFile(fileState.name, fileState.bytes, fileState.type));
          return formData;
        })(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to read file columns");
      }

      setImportFile(fileState);
      setPreview(data);
      setSampleRows(
        resolvePreviewRows(parsed.rows, data.columns ?? [], 5),
      );
      setColumnMap(data.suggestedMapping ?? {});
      setExcludedColumns([]);
      setStep("mapping");
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Failed to prepare field matching",
      );
    } finally {
      setIsLoadingPreview(false);
    }
  }

  async function handleImport() {
    setError(null);

    const activeColumnMap = stripExcludedMappings(columnMap, excludedColumns);
    const mappingError = validateColumnMap(activeColumnMap);
    if (mappingError) {
      setError(mappingError);
      return;
    }

    if (importBlocked) {
      setError(cooldownMessage);
      return;
    }

    if (!importFile) {
      setError("Choose a file before importing");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", createImportUploadFile(importFile.name, importFile.bytes, importFile.type));
      formData.append("defaultInventoryLocationId", defaultLocationId);
      formData.append("mode", mode);
      formData.append("columnMap", JSON.stringify(columnMap));
      formData.append("excludedColumns", JSON.stringify(excludedColumns));

      const response = await fetch("/api/listings/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Import failed");
      }

      setResult(data);
      setCompanyLastImportAt((current) => ({
        ...current,
        [selectedCompanyId]: data.lastImportAt ?? null,
      }));
      setStep("done");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Import failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "done" && result) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <h3 className="text-lg font-semibold text-green-900">Import complete</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-green-700">Rows</p>
            <p className="text-lg font-semibold text-slate-900">{result.totalRows}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-green-700">Created</p>
            <p className="text-lg font-semibold text-slate-900">{result.created}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-green-700">Updated</p>
            <p className="text-lg font-semibold text-slate-900">{result.updated}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-green-700">Errors</p>
            <p className="text-lg font-semibold text-slate-900">{result.skipped}</p>
          </div>
        </div>

        {result.ignoredRows ? (
          <p className="mt-3 text-sm text-slate-600">
            {result.ignoredRows.toLocaleString()} blank or header rows were skipped
            automatically.
          </p>
        ) : null}

        {result.skipped > 0 ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-900">Rows with issues</p>
            <p className="mt-1 text-sm text-amber-900">
              This import had row errors, so you can upload a corrected file
              immediately. The 24-hour import limit only applies after a fully
              successful import with zero errors.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {result.errors.map((rowError) => (
                <li key={`${rowError.rowNumber}-${rowError.message}`}>
                  Row {rowError.rowNumber}: {rowError.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setStep("setup");
            setResult(null);
            setPreview(null);
            setFile(null);
            setImportFile(null);
            setExcludedColumns([]);
          }}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          {result.skipped > 0 ? "Upload corrected file" : "Import another file"}
        </button>
      </div>
    );
  }

  if (step === "mapping" && preview) {
    return (
      <div className="space-y-6">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <ColumnMappingPanel
          preview={preview}
          mapping={columnMap}
          excludedColumns={excludedColumns}
          onMappingChange={setColumnMap}
          onExcludedColumnsChange={setExcludedColumns}
          sampleRows={sampleRows}
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStep("setup")}
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isSubmitting || importBlocked}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Importing inventory..." : "Import with this mapping"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handlePrepareMapping} className="space-y-6">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {importBlocked && cooldownMessage ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {cooldownMessage}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {companies.length > 1 ? (
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Company</span>
              <select
                required
                value={selectedCompanyId}
                onChange={(event) => {
                  setSelectedCompanyId(event.target.value);
                  setDefaultLocationId("");
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select your company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" value={selectedCompanyId} readOnly />
          )}

          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              Default inventory location
            </span>
            <select
              required
              value={defaultLocationId}
              onChange={(event) => setDefaultLocationId(event.target.value)}
              disabled={!selectedCompany?.inventoryLocations.length}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              <option value="">
                {selectedCompany
                  ? "Select default warehouse for imported rows"
                  : "Select a company first"}
              </option>
              {selectedCompany?.inventoryLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {formatInventoryLocation(location)}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="space-y-3 sm:col-span-2">
            <legend className="text-sm font-medium text-slate-700">
              Import mode
            </legend>
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <input
                type="radio"
                name="mode"
                value="append"
                checked={mode === "append"}
                onChange={() => setMode("append")}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">
                  Append / update
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  Add new parts and update matching MPN + manufacturer rows.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <input
                type="radio"
                name="mode"
                value="replace"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">
                  Replace entire catalog
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  Deactivate current listings for this company, then publish the
                  uploaded file as the new active inventory.
                </span>
              </span>
            </label>
          </fieldset>

          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">
              Inventory file
            </span>
            <input
              type="file"
              accept={supportedImportAcceptAttribute()}
              required
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700"
            />
            <span className="text-xs text-slate-500">
              Upload {supportedImportFormatsLabel()} exports, including Excel
              files like <code className="rounded bg-slate-100 px-1">Aplus Inventory_export_2026-06-15.xlsx</code>.
              Up to{" "}
              {MAX_IMPORT_ROWS.toLocaleString()} rows per import. Clean imports
              (no row errors) are limited to once every 24 hours per company.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={
            isLoadingPreview ||
            companies.length === 0 ||
            !selectedCompany?.inventoryLocations.length ||
            importBlocked
          }
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isLoadingPreview ? "Reading file..." : "Continue to field matching"}
        </button>
      </form>
    </div>
  );
}
