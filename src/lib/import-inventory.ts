import { db } from "@/lib/db";
import { formatInventoryLocation } from "@/lib/format";
import type { ImportFileFormat } from "@/lib/import-file";
import {
  assertImportAllowed,
  MAX_IMPORT_ROWS,
  resolveLastImportAtAfterImport,
} from "@/lib/import-limits";
import {
  applyColumnMap,
  normalizeImportRow,
  parseImportContent,
  stripExcludedMappings,
  validateColumnMap,
  type ColumnMap,
  type ImportRowError,
  type NormalizedImportRow,
} from "@/lib/inventory-import";
import type { ImportMode } from "@/lib/validations";

const BATCH_SIZE = 100;
const BATCH_TRANSACTION_TIMEOUT_MS = 60_000;

type ListingWriteResult = {
  created: number;
  updated: number;
  errors: ImportRowError[];
};

async function writeListingBatch(
  rows: NormalizedImportRow[],
  options: {
    companyId: string;
    mode: ImportMode;
    defaultLocationId: string;
    locations: LocationOption[];
    existingMap: Map<string, string>;
  },
): Promise<ListingWriteResult> {
  return db.$transaction(
    async (tx) => {
      let created = 0;
      let updated = 0;
      const errors: ImportRowError[] = [];

      for (const row of rows) {
        const inventoryLocationId = resolveLocationId(
          row,
          options.locations,
          options.defaultLocationId,
        );

        if (!inventoryLocationId) {
          errors.push({
            rowNumber: row.rowNumber,
            message: "Could not resolve inventory location",
          });
          continue;
        }

        const key = `${row.mpn.toLowerCase()}::${(row.manufacturer ?? "").toLowerCase()}`;
        const existingId =
          options.mode === "append" ? options.existingMap.get(key) : undefined;

        if (existingId) {
          await tx.partListing.update({
            where: { id: existingId },
            data: {
              inventoryLocationId,
              description: row.description ?? null,
              category: row.category,
              quantity: row.quantity,
              price: row.price ?? null,
              condition: row.condition,
              dateCode: row.dateCode ?? null,
              leadTimeDays: row.leadTimeDays ?? null,
              datasheetUrl: row.datasheetUrl ?? null,
              isActive: true,
            },
          });
          updated += 1;
          continue;
        }

        const createdListing = await tx.partListing.create({
          data: {
            companyId: options.companyId,
            inventoryLocationId,
            mpn: row.mpn,
            manufacturer: row.manufacturer ?? "",
            description: row.description ?? null,
            category: row.category,
            quantity: row.quantity,
            price: row.price ?? null,
            condition: row.condition,
            dateCode: row.dateCode ?? null,
            leadTimeDays: row.leadTimeDays ?? null,
            datasheetUrl: row.datasheetUrl ?? null,
            isActive: true,
          },
        });

        if (options.mode === "append") {
          options.existingMap.set(key, createdListing.id);
        }
        created += 1;
      }

      return { created, updated, errors };
    },
    {
      maxWait: 10_000,
      timeout: BATCH_TRANSACTION_TIMEOUT_MS,
    },
  );
}

export type ImportInventoryInput = {
  companyId: string;
  defaultInventoryLocationId: string;
  mode: ImportMode;
  fileName: string;
  fileBytes: Uint8Array;
  columnMap?: ColumnMap;
  excludedColumns?: string[];
};

export type ImportInventoryResult = {
  format: ImportFileFormat;
  mode: ImportMode;
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  ignoredRows: number;
  errors: ImportRowError[];
  lastImportAt: string | null;
};

type LocationOption = {
  id: string;
  label: string | null;
  city: string;
  state: string | null;
  country: string;
};

function resolveLocationId(
  row: NormalizedImportRow,
  locations: LocationOption[],
  defaultLocationId: string,
): string | null {
  if (!row.locationLabel) {
    return defaultLocationId;
  }

  const needle = row.locationLabel.trim().toLowerCase();
  const match = locations.find((location) => {
    const formatted = formatInventoryLocation(location).toLowerCase();
    const label = location.label?.trim().toLowerCase() ?? "";
    const city = location.city.trim().toLowerCase();
    return (
      formatted === needle ||
      label === needle ||
      city === needle ||
      formatted.includes(needle)
    );
  });

  return match?.id ?? defaultLocationId;
}

export async function importInventory(
  input: ImportInventoryInput,
): Promise<ImportInventoryResult> {
  const company = await db.company.findUnique({
    where: { id: input.companyId },
    include: { inventoryLocations: true },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  const defaultLocation = company.inventoryLocations.find(
    (location) => location.id === input.defaultInventoryLocationId,
  );

  if (!defaultLocation) {
    throw new Error("Select a valid default inventory location for this company");
  }

  assertImportAllowed(company.lastImportAt);

  const { rows, format } = parseImportContent(input.fileName, input.fileBytes);

  const activeColumnMap = input.columnMap
    ? stripExcludedMappings(input.columnMap, input.excludedColumns)
    : undefined;

  if (activeColumnMap) {
    const mappingError = validateColumnMap(activeColumnMap);
    if (mappingError) {
      throw new Error(mappingError);
    }
  }

  if (rows.length === 0) {
    throw new Error("The import file did not contain any rows");
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`Imports are limited to ${MAX_IMPORT_ROWS.toLocaleString()} rows per upload`);
  }

  const normalizedRows: NormalizedImportRow[] = [];
  const errors: ImportRowError[] = [];
  let ignoredRows = 0;

  rows.forEach((row, index) => {
    const mappedRow = activeColumnMap
      ? applyColumnMap(row, activeColumnMap, input.excludedColumns)
      : row;
    const result = normalizeImportRow(mappedRow, index + 1);
    if (result.ignored) {
      ignoredRows += 1;
      return;
    }
    if (result.error) {
      errors.push(result.error);
      return;
    }
    if (result.data) {
      normalizedRows.push(result.data);
    }
  });

  if (normalizedRows.length === 0) {
    await db.company.update({
      where: { id: company.id },
      data: { lastImportAt: null },
    });

    return {
      format,
      mode: input.mode,
      totalRows: rows.length,
      created: 0,
      updated: 0,
      skipped: errors.length,
      ignoredRows,
      errors,
      lastImportAt: null,
    };
  }

  let created = 0;
  let updated = 0;

  if (input.mode === "replace") {
    await db.partListing.updateMany({
      where: { companyId: company.id, isActive: true },
      data: { isActive: false },
    });
  }

  const existingListings = await db.partListing.findMany({
    where: {
      companyId: company.id,
      isActive: true,
    },
    select: {
      id: true,
      mpn: true,
      manufacturer: true,
    },
  });

  const existingMap = new Map(
    existingListings.map((listing) => [
      `${listing.mpn.toLowerCase()}::${(listing.manufacturer ?? "").toLowerCase()}`,
      listing.id,
    ]),
  );

  for (let index = 0; index < normalizedRows.length; index += BATCH_SIZE) {
    const batch = normalizedRows.slice(index, index + BATCH_SIZE);
    const batchResult = await writeListingBatch(batch, {
      companyId: company.id,
      mode: input.mode,
      defaultLocationId: defaultLocation.id,
      locations: company.inventoryLocations,
      existingMap,
    });

    created += batchResult.created;
    updated += batchResult.updated;
    errors.push(...batchResult.errors);
  }

  const result = {
    format,
    mode: input.mode,
    totalRows: rows.length,
    created,
    updated,
    skipped: errors.length,
    ignoredRows,
    errors: errors.slice(0, 100),
    lastImportAt: null as string | null,
  };

  const lastImportAt = resolveLastImportAtAfterImport(result);

  await db.company.update({
    where: { id: company.id },
    data: { lastImportAt },
  });

  result.lastImportAt = lastImportAt?.toISOString() ?? null;

  return result;
}

export async function importInventoryFromJson(input: {
  companyId: string;
  defaultInventoryLocationId: string;
  mode: ImportMode;
  parts: Record<string, unknown>[];
  columnMap?: ColumnMap;
  excludedColumns?: string[];
}): Promise<ImportInventoryResult> {
  return importInventory({
    companyId: input.companyId,
    defaultInventoryLocationId: input.defaultInventoryLocationId,
    mode: input.mode,
    fileName: "inventory.json",
    fileBytes: new TextEncoder().encode(JSON.stringify(input.parts)),
    columnMap: input.columnMap,
    excludedColumns: input.excludedColumns,
  });
}
