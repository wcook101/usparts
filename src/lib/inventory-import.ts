import type { PartCategory, PartCondition } from "@/generated/prisma/client";
import { normalizeHeader, parseCsv, type ParsedColumn } from "@/lib/csv";
import {
  decodeImportText,
  getImportFileFormat,
  type ImportFileFormat,
} from "@/lib/import-file";
import { normalizeWebsiteUrl } from "@/lib/format";
import { parseXlsx } from "@/lib/xlsx";

export const IMPORT_TARGET_FIELDS = [
  { key: "mpn", label: "Part number (MPN)", required: true },
  { key: "manufacturer", label: "Manufacturer", required: false },
  { key: "quantity", label: "Quantity in stock", required: true },
  { key: "price", label: "Unit price", required: false },
  { key: "description", label: "Description", required: false },
  { key: "category", label: "Category", required: false },
  { key: "condition", label: "Condition", required: false },
  { key: "dateCode", label: "Date Code", required: false },
  { key: "leadTimeDays", label: "Lead time (days)", required: false },
  { key: "location", label: "Warehouse location", required: false },
  { key: "datasheetUrl", label: "Datasheet URL", required: false },
] as const;

export type ImportTargetField = (typeof IMPORT_TARGET_FIELDS)[number]["key"];

export type ColumnMap = Partial<Record<ImportTargetField, string>>;

export type ExcludedColumns = Set<string> | string[];

export const IMPORT_FIELD_ALIASES: Record<ImportTargetField, string[]> = {
  mpn: ["mpn", "part_number", "partnumber", "part_no", "partno", "sku", "part", "item"],
  manufacturer: ["manufacturer", "mfr", "mfg", "brand", "maker", "vendor"],
  quantity: ["quantity", "qty", "stock", "quantity_on_hand", "on_hand", "available", "qoh"],
  price: ["price", "unit_price", "unitprice", "cost", "list_price", "sell_price"],
  description: ["description", "desc", "notes", "comment", "details"],
  category: ["category", "part_category", "type", "family"],
  condition: ["condition", "cond", "grade"],
  dateCode: [
    "date_code",
    "datecode",
    "date_code_",
    "d_c",
    "dc",
    "lot",
    "lot_no",
    "lot_number",
    "lotnumber",
    "lot_code",
    "date",
    "mfg_date",
    "mfgdate",
    "production_date",
    "cod_date",
  ],
  leadTimeDays: ["lead_time_days", "leadtime", "lead_time", "lead_days", "leadtime_days"],
  datasheetUrl: ["datasheet_url", "datasheet", "datasheet_link", "spec_url", "url"],
  location: ["location", "warehouse", "inventory_location", "site", "facility"],
};

const CATEGORY_MAP: Record<string, PartCategory> = {
  semiconductor: "SEMICONDUCTOR",
  semiconductors: "SEMICONDUCTOR",
  passive: "PASSIVE",
  passives: "PASSIVE",
  connector: "CONNECTOR",
  connectors: "CONNECTOR",
  integrated_circuit: "INTEGRATED_CIRCUIT",
  integratedcircuit: "INTEGRATED_CIRCUIT",
  ic: "INTEGRATED_CIRCUIT",
  ics: "INTEGRATED_CIRCUIT",
  power: "POWER",
  sensor: "SENSOR",
  sensors: "SENSOR",
  memory: "MEMORY",
  display: "DISPLAY",
  rf_wireless: "RF_WIRELESS",
  rf: "RF_WIRELESS",
  wireless: "RF_WIRELESS",
  other: "OTHER",
};

const CONDITION_MAP: Record<string, PartCondition> = {
  new: "NEW",
  refurbished: "REFURBISHED",
  refurbrished: "REFURBISHED",
  used: "USED",
};

export type NormalizedImportRow = {
  rowNumber: number;
  mpn: string;
  manufacturer: string;
  quantity: number;
  price?: number;
  description?: string;
  category: PartCategory;
  condition: PartCondition;
  dateCode?: string;
  leadTimeDays?: number;
  datasheetUrl?: string;
  locationLabel?: string;
};

export type ImportRowError = {
  rowNumber: number;
  message: string;
};

export type ImportPreview = {
  format: ImportFileFormat;
  columns: Array<ParsedColumn & { samples: string[] }>;
  rowCount: number;
  suggestedMapping: ColumnMap;
  sampleRows: Record<string, string>[];
};

export type MappedPreviewRow = {
  rowNumber: number;
  mpn: string;
  manufacturer: string;
  quantity: string;
  price: string;
  validationError?: string;
};

export function getFieldValue(
  row: Record<string, string>,
  field: ImportTargetField,
): string {
  if (row[field]?.trim()) {
    return row[field].trim();
  }

  for (const alias of IMPORT_FIELD_ALIASES[field]) {
    const value = row[alias];
    if (value?.trim()) return value.trim();
  }
  return "";
}

export function toExcludedColumnSet(excludedColumns?: ExcludedColumns): Set<string> {
  if (!excludedColumns) {
    return new Set();
  }

  return excludedColumns instanceof Set
    ? excludedColumns
    : new Set(excludedColumns);
}

export function stripExcludedMappings(
  columnMap: ColumnMap,
  excludedColumns?: ExcludedColumns,
): ColumnMap {
  const excluded = toExcludedColumnSet(excludedColumns);
  if (excluded.size === 0) {
    return columnMap;
  }

  const next: ColumnMap = {};
  for (const [targetField, sourceKey] of Object.entries(columnMap)) {
    if (sourceKey && !excluded.has(sourceKey)) {
      next[targetField as ImportTargetField] = sourceKey;
    }
  }

  return next;
}

export function applyColumnMap(
  row: Record<string, string>,
  columnMap: ColumnMap,
  excludedColumns?: ExcludedColumns,
): Record<string, string> {
  const excluded = toExcludedColumnSet(excludedColumns);
  const mapped: Record<string, string> = {};

  for (const [targetField, sourceKey] of Object.entries(columnMap)) {
    if (!sourceKey || excluded.has(sourceKey)) continue;
    const value = row[sourceKey];
    if (value != null) {
      mapped[targetField] = value;
    }
  }

  return mapped;
}

export function guessColumnMap(
  columns: ParsedColumn[],
  excludedColumns?: ExcludedColumns,
): ColumnMap {
  const excluded = toExcludedColumnSet(excludedColumns);
  const mapping: ColumnMap = {};
  const used = new Set<string>();

  for (const field of IMPORT_TARGET_FIELDS) {
    const aliases = IMPORT_FIELD_ALIASES[field.key];
    const match = columns.find((column) => {
      if (used.has(column.key) || excluded.has(column.key)) return false;
      const normalizedLabel = normalizeHeader(column.label);
      return aliases.some(
        (alias) =>
          normalizedLabel === alias ||
          normalizedLabel.includes(alias) ||
          alias.includes(normalizedLabel),
      );
    });

    if (match) {
      mapping[field.key] = match.key;
      used.add(match.key);
    }
  }

  return mapping;
}

export function guessColumnMapByPosition(
  columns: ParsedColumn[],
  excludedColumns?: ExcludedColumns,
): ColumnMap {
  const excluded = toExcludedColumnSet(excludedColumns);
  const order: ImportTargetField[] = [
    "mpn",
    "manufacturer",
    "quantity",
    "price",
    "description",
    "category",
    "condition",
    "dateCode",
    "leadTimeDays",
    "location",
    "datasheetUrl",
  ];

  const mapping: ColumnMap = {};
  let columnIndex = 0;

  for (const field of order) {
    while (columnIndex < columns.length && excluded.has(columns[columnIndex].key)) {
      columnIndex += 1;
    }

    const column = columns[columnIndex];
    if (column) {
      mapping[field] = column.key;
      columnIndex += 1;
    }
  }

  return mapping;
}

export function buildPreview(
  columns: ParsedColumn[],
  rows: Record<string, string>[],
  format: ImportFileFormat,
): ImportPreview {
  const columnsWithSamples = columns.map((column) => ({
    ...column,
    samples: rows.slice(0, 3).map((row) => row[column.key] ?? ""),
  }));

  return {
    format,
    columns: columnsWithSamples,
    rowCount: rows.length,
    suggestedMapping: guessColumnMap(columns),
    sampleRows: rows.slice(0, 5),
  };
}

export function resolvePreviewRows(
  sampleRows: Record<string, string>[],
  columns: Array<ParsedColumn & { samples?: string[] }>,
  limit = 5,
): Record<string, string>[] {
  const usableRows = sampleRows.filter((row) =>
    Object.values(row).some((value) => value.trim()),
  );

  if (usableRows.length > 0) {
    return usableRows.slice(0, limit);
  }

  const sampleCount = Math.max(0, ...columns.map((column) => column.samples?.length ?? 0));
  if (sampleCount === 0) {
    return [];
  }

  return Array.from({ length: Math.min(limit, sampleCount) }, (_, index) => {
    const row: Record<string, string> = {};
    for (const column of columns) {
      row[column.key] = column.samples?.[index] ?? "";
    }
    return row;
  });
}

export function buildMappedPreviewRows(
  rows: Record<string, string>[],
  columnMap: ColumnMap,
  excludedColumns?: ExcludedColumns,
  columns: Array<ParsedColumn & { samples?: string[] }> = [],
  limit = 3,
): MappedPreviewRow[] {
  const activeMap = stripExcludedMappings(columnMap, excludedColumns);
  const previewRows = resolvePreviewRows(rows, columns, Math.max(limit, 5));

  return previewRows.slice(0, limit).map((row, index) => {
    const mapped = applyColumnMap(row, activeMap, excludedColumns);
    const normalized = normalizeImportRow(mapped, index + 1);

    return {
      rowNumber: index + 1,
      mpn: getFieldValue(mapped, "mpn") || "—",
      manufacturer: getFieldValue(mapped, "manufacturer") || "—",
      quantity: getFieldValue(mapped, "quantity") || "—",
      price: getFieldValue(mapped, "price") || "—",
      validationError: normalized.error?.message,
    };
  });
}

export function validateColumnMap(columnMap: ColumnMap): string | null {
  for (const field of IMPORT_TARGET_FIELDS) {
    if (field.required && !columnMap[field.key]) {
      return `Match "${field.label}" to one of your file columns before importing.`;
    }
  }
  return null;
}

export function normalizeCategory(value: string): PartCategory {
  const key = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return CATEGORY_MAP[key] ?? "OTHER";
}

export function normalizeCondition(value: string): PartCondition {
  const key = value.trim().toLowerCase();
  return CONDITION_MAP[key] ?? "NEW";
}

const QUANTITY_EMPTY_TOKENS = new Set([
  "",
  "n/a",
  "na",
  "none",
  "null",
  "-",
  "—",
  "tbd",
  "qty",
]);

export function parseImportQuantity(raw: string | undefined): number {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return 0;
  }

  const token = trimmed.toLowerCase().replace(/\s+/g, "");
  if (QUANTITY_EMPTY_TOKENS.has(token)) {
    return 0;
  }

  const withoutCommas = trimmed.replace(/,/g, "");
  const match = withoutCommas.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return 0;
  }

  const parsed = Number(match[0]);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.trunc(parsed));
}

const INVALID_MPN_TOKENS = new Set(["-", "—", "n/a", "na", "none", "null", "tbd"]);

export function isPlaceholderMpn(value: string): boolean {
  const token = value.trim().toLowerCase();
  return !token || INVALID_MPN_TOKENS.has(token);
}

export function isIgnorableImportRow(row: Record<string, string>): boolean {
  if (!Object.values(row).some((value) => value?.trim())) {
    return true;
  }

  const mpn = getFieldValue(row, "mpn");
  return isPlaceholderMpn(mpn);
}

const QUOTE_PRICE_TOKENS = new Set([
  "",
  "n/a",
  "na",
  "none",
  "null",
  "tbd",
  "quote",
  "rfq",
  "call",
  "0",
  "0.0",
  "0.00",
  "0.000",
  "0.0000",
]);

export function parseOptionalPrice(priceRaw: string): number | undefined {
  const trimmed = priceRaw.trim();
  if (!trimmed) {
    return undefined;
  }

  const token = trimmed.toLowerCase().replace(/[$,\s]/g, "");
  if (QUOTE_PRICE_TOKENS.has(token)) {
    return undefined;
  }

  const price = Number(trimmed.replace(/[$,]/g, ""));
  if (!Number.isFinite(price) || price <= 0) {
    return undefined;
  }

  return price;
}

export function normalizeImportRow(
  row: Record<string, string>,
  rowNumber: number,
): { data?: NormalizedImportRow; error?: ImportRowError; ignored?: boolean } {
  if (isIgnorableImportRow(row)) {
    return { ignored: true };
  }

  const mpn = getFieldValue(row, "mpn");
  const manufacturer = getFieldValue(row, "manufacturer");
  const quantityRaw = getFieldValue(row, "quantity");
  const priceRaw = getFieldValue(row, "price");

  const quantity = parseImportQuantity(quantityRaw);
  const price = priceRaw ? parseOptionalPrice(priceRaw) : undefined;

  const leadTimeRaw = getFieldValue(row, "leadTimeDays");
  const leadTimeDays = leadTimeRaw ? Number(leadTimeRaw) : undefined;

  const description = getFieldValue(row, "description") || undefined;
  const categoryRaw = getFieldValue(row, "category");
  const category = categoryRaw ? normalizeCategory(categoryRaw) : "OTHER";
  const conditionRaw = getFieldValue(row, "condition");
  const condition = conditionRaw ? normalizeCondition(conditionRaw) : "NEW";
  const dateCode = getFieldValue(row, "dateCode") || undefined;
  const locationLabel = getFieldValue(row, "location") || undefined;

  let datasheetUrl = getFieldValue(row, "datasheetUrl") || undefined;
  if (datasheetUrl) {
    datasheetUrl = normalizeWebsiteUrl(datasheetUrl);
  }

  return {
    data: {
      rowNumber,
      mpn,
      manufacturer,
      quantity,
      price,
      description,
      category,
      condition,
      dateCode,
      leadTimeDays:
        leadTimeRaw && Number.isInteger(leadTimeDays) && leadTimeDays! >= 0
          ? leadTimeDays
          : undefined,
      datasheetUrl,
      locationLabel,
    },
  };
}

export function parseImportContent(
  fileName: string,
  bytes: Uint8Array,
): { columns: ParsedColumn[]; rows: Record<string, string>[]; format: ImportFileFormat } {
  const format = getImportFileFormat(fileName);

  if (!format) {
    throw new Error("Unsupported import file type");
  }

  if (format === "json") {
    const parsed = JSON.parse(decodeImportText(bytes)) as unknown;
    const rows = extractJsonRows(parsed);
    const columns = buildJsonColumns(rows);
    return { columns, rows, format };
  }

  if (format === "xlsx") {
    const { columns, rows } = parseXlsx(bytes);
    return { columns, rows, format };
  }

  const { columns, rows } = parseCsv(decodeImportText(bytes));
  return { columns, rows, format };
}

export function previewImportContent(
  fileName: string,
  bytes: Uint8Array,
): ImportPreview {
  const { columns, rows, format } = parseImportContent(fileName, bytes);
  return buildPreview(columns, rows, format);
}

function buildJsonColumns(rows: Record<string, string>[]): ParsedColumn[] {
  const keys = new Set<string>();
  rows.slice(0, 20).forEach((row) => {
    Object.keys(row).forEach((key) => keys.add(key));
  });

  return Array.from(keys).map((key, index) => ({
    key,
    label: key,
    index,
  }));
}

function extractJsonRows(payload: unknown): Record<string, string>[] {
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      throw new Error(
        "JSON file is empty. Upload your inventory spreadsheet (Excel or CSV), not an import report.",
      );
    }

    return payload.map((item) => flattenRecord(item));
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as Record<string, unknown>;

    if ("skippedRows" in objectPayload || "columnMap" in objectPayload) {
      throw new Error(
        "This JSON file looks like an import report, not inventory data. Upload the original Excel (.xlsx) or CSV file instead.",
      );
    }

    const parts = objectPayload.parts ?? objectPayload.inventory ?? objectPayload.items;
    if (Array.isArray(parts)) {
      if (parts.length === 0) {
        throw new Error("JSON inventory array is empty.");
      }

      return parts.map((item) => flattenRecord(item));
    }

    const keys = Object.keys(objectPayload);
    throw new Error(
      keys.length === 0
        ? "JSON file is empty. Upload your inventory spreadsheet (Excel or CSV)."
        : `JSON must be an array of parts or an object with a parts/inventory/items array. Found keys: ${keys.slice(0, 6).join(", ")}.`,
    );
  }

  throw new Error(
    "JSON must be an array of parts or an object with a parts/inventory/items array.",
  );
}

function flattenRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") {
    throw new Error("Each imported row must be an object");
  }

  const record: Record<string, string> = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    if (fieldValue == null) continue;
    const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    record[normalizedKey] = String(fieldValue);
  }
  return record;
}
