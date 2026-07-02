import type { Prisma } from "@/generated/prisma/client";
import type { NormalizedImportRow } from "@/lib/inventory-import";

export type SkippedImportRowReason = "ignored" | "error" | "merged";

export type SkippedImportRow = {
  rowNumber: number;
  reason: SkippedImportRowReason;
  message: string;
  mpn?: string;
  manufacturer?: string;
  dateCode?: string;
  quantity?: string;
  price?: string;
  description?: string;
  keptRowNumber?: number;
};

export const MAX_SKIPPED_ROWS_IN_RESULT = 250;

function normalizeDateCodeKey(dateCode: string | null | undefined): string {
  return (dateCode ?? "").trim().toLowerCase();
}

function normalizePriceKey(price: number | undefined | null): string {
  if (price == null || !Number.isFinite(price)) {
    return "";
  }

  return price.toFixed(4);
}

export function listingMatchKey(
  mpn: string,
  manufacturer: string | null | undefined,
  dateCode: string | null | undefined,
  quantity: number,
  price?: number | null,
): string {
  return [
    mpn.toLowerCase(),
    (manufacturer ?? "").toLowerCase(),
    normalizeDateCodeKey(dateCode),
    String(quantity),
    normalizePriceKey(price),
  ].join("::");
}

export function rowListingMatchKey(row: NormalizedImportRow): string {
  return listingMatchKey(
    row.mpn,
    row.manufacturer,
    row.dateCode,
    row.quantity,
    row.price,
  );
}

export function listingMatchKeyFromCreateRow(row: Prisma.PartListingCreateManyInput): string {
  const price = row.price == null ? undefined : Number(row.price);
  return listingMatchKey(row.mpn, row.manufacturer, row.dateCode, row.quantity, price);
}

export function listingMatchKeyFromDb(listing: {
  mpn: string;
  manufacturer: string;
  dateCode: string | null;
  quantity: number;
  price: Prisma.Decimal | number | null;
}): string {
  const price =
    listing.price == null
      ? undefined
      : typeof listing.price === "number"
        ? listing.price
        : Number(listing.price);

  return listingMatchKey(
    listing.mpn,
    listing.manufacturer,
    listing.dateCode,
    listing.quantity,
    price,
  );
}

export function skippedRowFromNormalized(
  row: NormalizedImportRow,
  reason: SkippedImportRowReason,
  message: string,
  keptRowNumber?: number,
): SkippedImportRow {
  return {
    rowNumber: row.rowNumber,
    reason,
    message,
    mpn: row.mpn,
    manufacturer: row.manufacturer,
    dateCode: row.dateCode ?? "",
    quantity: String(row.quantity),
    price: row.price != null ? String(row.price) : "",
    description: row.description ?? "",
    keptRowNumber,
  };
}

export function buildSkippedRowsCsv(rows: SkippedImportRow[]): string {
  const header = [
    "row_number",
    "reason",
    "message",
    "mpn",
    "manufacturer",
    "date_code",
    "quantity",
    "price",
    "description",
    "kept_row_number",
  ];

  const escape = (value: string | undefined) => {
    const text = value ?? "";
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const lines = rows.map((row) =>
    [
      row.rowNumber,
      row.reason,
      row.message,
      row.mpn,
      row.manufacturer,
      row.dateCode,
      row.quantity,
      row.price,
      row.description,
      row.keptRowNumber ?? "",
    ]
      .map((value) => escape(value == null ? "" : String(value)))
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}
