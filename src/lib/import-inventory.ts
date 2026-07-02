import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { formatInventoryLocation } from "@/lib/format";
import type { ImportFileFormat } from "@/lib/import-file";
import { normalizeMpn } from "@/lib/mpn-normalize";
import {
  assertImportAllowed,
  MAX_IMPORT_ROWS,
  resolveLastImportAtAfterImport,
} from "@/lib/import-limits";
import {
  applyColumnMap,
  getFieldValue,
  normalizeImportRow,
  parseImportContent,
  stripExcludedMappings,
  validateColumnMap,
  type ColumnMap,
  type ImportRowError,
  type NormalizedImportRow,
} from "@/lib/inventory-import";
import type { ImportMode } from "@/lib/validations";
import {
  listingMatchKeyFromCreateRow,
  listingMatchKeyFromDb,
  MAX_SKIPPED_ROWS_IN_RESULT,
  rowListingMatchKey,
  skippedRowFromNormalized,
  type SkippedImportRow,
} from "@/lib/import-listing-key";

const BATCH_SIZE = 1_000;
const BATCH_TRANSACTION_TIMEOUT_MS = 180_000;
const UPDATE_CONCURRENCY = 25;

type ListingWriteResult = {
  created: number;
  updated: number;
  mergedDuplicates: number;
  mergedSkippedRows: SkippedImportRow[];
  errors: ImportRowError[];
};

function pushSkippedRow(rows: SkippedImportRow[], row: SkippedImportRow): void {
  if (rows.length < MAX_SKIPPED_ROWS_IN_RESULT) {
    rows.push(row);
  }
}

function rowToCreateData(
  row: NormalizedImportRow,
  inventoryLocationId: string,
  companyId: string,
): Prisma.PartListingCreateManyInput {
  return {
    companyId,
    inventoryLocationId,
    mpn: row.mpn,
    mpnNormalized: normalizeMpn(row.mpn),
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
  };
}

async function refreshExistingMap(
  tx: Prisma.TransactionClient,
  companyId: string,
  createdRows: Prisma.PartListingCreateManyInput[],
  existingMap: Map<string, string>,
): Promise<void> {
  if (createdRows.length === 0) {
    return;
  }

  const createdKeys = new Set(createdRows.map((row) => listingMatchKeyFromCreateRow(row)));
  const mpns = [...new Set(createdRows.map((row) => row.mpn))];
  const listings = await tx.partListing.findMany({
    where: {
      companyId,
      isActive: true,
      mpn: { in: mpns },
    },
    select: {
      id: true,
      mpn: true,
      manufacturer: true,
      dateCode: true,
      quantity: true,
      price: true,
    },
  });

  for (const listing of listings) {
    const key = listingMatchKeyFromDb(listing);
    if (createdKeys.has(key)) {
      existingMap.set(key, listing.id);
    }
  }
}

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
      const errors: ImportRowError[] = [];
      let mergedDuplicates = 0;
      const mergedSkippedRows: SkippedImportRow[] = [];
      const pendingCreates = new Map<
        string,
        { row: NormalizedImportRow; inventoryLocationId: string }
      >();
      const toUpdate: { id: string; row: NormalizedImportRow; inventoryLocationId: string }[] =
        [];

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

        const key = rowListingMatchKey(row);
        const existingId =
          options.mode === "append" ? options.existingMap.get(key) : undefined;

        if (existingId) {
          toUpdate.push({ id: existingId, row, inventoryLocationId });
          continue;
        }

        if (pendingCreates.has(key)) {
          mergedDuplicates += 1;
          const kept = pendingCreates.get(key)!;
          mergedSkippedRows.push(
            skippedRowFromNormalized(
              row,
              "merged",
              `Exact duplicate — row ${kept.row.rowNumber} was kept instead`,
              kept.row.rowNumber,
            ),
          );
        }

        pendingCreates.set(key, { row, inventoryLocationId });
      }

      const toCreate = [...pendingCreates.values()].map(({ row, inventoryLocationId }) =>
        rowToCreateData(row, inventoryLocationId, options.companyId),
      );

      let created = 0;
      let updated = 0;

      if (toCreate.length > 0) {
        const createResult = await tx.partListing.createMany({
          data: toCreate,
        });
        created = createResult.count;

        if (options.mode === "append") {
          await refreshExistingMap(tx, options.companyId, toCreate, options.existingMap);
        }
      }

      for (let index = 0; index < toUpdate.length; index += UPDATE_CONCURRENCY) {
        const chunk = toUpdate.slice(index, index + UPDATE_CONCURRENCY);
        await Promise.all(
          chunk.map(async ({ id, row, inventoryLocationId }) => {
            await tx.partListing.update({
              where: { id },
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
          }),
        );
        updated += chunk.length;
      }

      return { created, updated, mergedDuplicates, mergedSkippedRows, errors };
    },
    {
      maxWait: 30_000,
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
  skipImportCooldown?: boolean;
};

export type ImportInventoryResult = {
  format: ImportFileFormat;
  mode: ImportMode;
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  ignoredRows: number;
  mergedDuplicates: number;
  skippedRowCount: number;
  skippedRows: SkippedImportRow[];
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

  if (!input.skipImportCooldown) {
    assertImportAllowed(company.lastImportAt);
  }

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
  const skippedRows: SkippedImportRow[] = [];
  let ignoredRows = 0;

  rows.forEach((row, index) => {
    const mappedRow = activeColumnMap
      ? applyColumnMap(row, activeColumnMap, input.excludedColumns)
      : row;
    const result = normalizeImportRow(mappedRow, index + 1);
    if (result.ignored) {
      ignoredRows += 1;
      pushSkippedRow(skippedRows, {
        rowNumber: index + 1,
        reason: "ignored",
        message: "Blank or header row",
        mpn: getFieldValue(mappedRow, "mpn") || undefined,
        manufacturer: getFieldValue(mappedRow, "manufacturer") || undefined,
        dateCode: getFieldValue(mappedRow, "dateCode") || undefined,
        quantity: getFieldValue(mappedRow, "quantity") || undefined,
        price: getFieldValue(mappedRow, "price") || undefined,
        description: getFieldValue(mappedRow, "description") || undefined,
      });
      return;
    }
    if (result.error) {
      errors.push(result.error);
      pushSkippedRow(skippedRows, {
        rowNumber: result.error.rowNumber,
        reason: "error",
        message: result.error.message,
        mpn: getFieldValue(mappedRow, "mpn") || undefined,
        manufacturer: getFieldValue(mappedRow, "manufacturer") || undefined,
        dateCode: getFieldValue(mappedRow, "dateCode") || undefined,
        quantity: getFieldValue(mappedRow, "quantity") || undefined,
        price: getFieldValue(mappedRow, "price") || undefined,
        description: getFieldValue(mappedRow, "description") || undefined,
      });
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
      mergedDuplicates: 0,
      skippedRowCount: ignoredRows + errors.length,
      skippedRows,
      errors,
      lastImportAt: null,
    };
  }

  let created = 0;
  let updated = 0;
  let mergedDuplicates = 0;
  const mergedSkippedRows: SkippedImportRow[] = [];

  const importStartedAt = new Date();

  const existingMap =
    input.mode === "append"
      ? new Map(
          (
            await db.partListing.findMany({
              where: {
                companyId: company.id,
                isActive: true,
              },
              select: {
                id: true,
                mpn: true,
                manufacturer: true,
                dateCode: true,
                quantity: true,
                price: true,
              },
            })
          ).map((listing) => [listingMatchKeyFromDb(listing), listing.id]),
        )
      : new Map<string, string>();

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
    mergedDuplicates += batchResult.mergedDuplicates;
    mergedSkippedRows.push(...batchResult.mergedSkippedRows);
    errors.push(...batchResult.errors);

    for (const error of batchResult.errors) {
      pushSkippedRow(skippedRows, {
        rowNumber: error.rowNumber,
        reason: "error",
        message: error.message,
      });
    }
  }

  for (const row of mergedSkippedRows) {
    pushSkippedRow(skippedRows, row);
  }

  skippedRows.sort((left, right) => left.rowNumber - right.rowNumber);

  if (input.mode === "replace") {
    await db.partListing.updateMany({
      where: {
        companyId: company.id,
        isActive: true,
        createdAt: { lt: importStartedAt },
      },
      data: { isActive: false },
    });
  }

  const result = {
    format,
    mode: input.mode,
    totalRows: rows.length,
    created,
    updated,
    skipped: errors.length,
    ignoredRows,
    mergedDuplicates,
    skippedRowCount: ignoredRows + errors.length + mergedDuplicates,
    skippedRows,
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
