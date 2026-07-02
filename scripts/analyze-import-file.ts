import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  applyColumnMap,
  getFieldValue,
  guessColumnMap,
  normalizeImportRow,
  parseImportContent,
  stripExcludedMappings,
  type ColumnMap,
} from "../src/lib/inventory-import";
import {
  buildSkippedRowsCsv,
  rowListingMatchKey,
  skippedRowFromNormalized,
  type SkippedImportRow,
} from "../src/lib/import-listing-key";

function usage(): never {
  console.error("Usage: npx tsx scripts/analyze-import-file.ts <inventory-file> [column-map.json]");
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  usage();
}

const bytes = new Uint8Array(readFileSync(resolve(filePath)));
const fileName = resolve(filePath).split(/[/\\]/).pop() ?? filePath;
const { rows, columns } = parseImportContent(fileName, bytes);

let columnMap: ColumnMap = guessColumnMap(columns);
const mapPath = process.argv[3];
if (mapPath) {
  columnMap = JSON.parse(readFileSync(resolve(mapPath), "utf8")) as ColumnMap;
}

const activeMap = stripExcludedMappings(columnMap);
const groups = new Map<string, SkippedImportRow[]>();
const ignoredRows: SkippedImportRow[] = [];
const errorRows: SkippedImportRow[] = [];

rows.forEach((row, index) => {
  const mapped = applyColumnMap(row, activeMap);
  const normalized = normalizeImportRow(mapped, index + 1);

  if (normalized.ignored) {
    ignoredRows.push({
      rowNumber: index + 1,
      reason: "ignored",
      message: "Blank or header row",
      mpn: getFieldValue(mapped, "mpn") || undefined,
      manufacturer: getFieldValue(mapped, "manufacturer") || undefined,
      dateCode: getFieldValue(mapped, "dateCode") || undefined,
      quantity: getFieldValue(mapped, "quantity") || undefined,
      price: getFieldValue(mapped, "price") || undefined,
      description: getFieldValue(mapped, "description") || undefined,
    });
    return;
  }

  if (normalized.error || !normalized.data) {
    errorRows.push({
      rowNumber: index + 1,
      reason: "error",
      message: normalized.error?.message ?? "Invalid row",
      mpn: getFieldValue(mapped, "mpn") || undefined,
      manufacturer: getFieldValue(mapped, "manufacturer") || undefined,
      dateCode: getFieldValue(mapped, "dateCode") || undefined,
      quantity: getFieldValue(mapped, "quantity") || undefined,
      price: getFieldValue(mapped, "price") || undefined,
      description: getFieldValue(mapped, "description") || undefined,
    });
    return;
  }

  const data = normalized.data;
  const key = rowListingMatchKey(data);
  const sample = skippedRowFromNormalized(
    data,
    "merged",
    "Exact duplicate of another row in this file",
    data.rowNumber,
  );

  const bucket = groups.get(key) ?? [];
  bucket.push(sample);
  groups.set(key, bucket);
});

const mergedRows: SkippedImportRow[] = [];
for (const members of groups.values()) {
  if (members.length <= 1) {
    continue;
  }

  const keptRowNumber = members[members.length - 1]!.rowNumber;
  for (const member of members.slice(0, -1)) {
    mergedRows.push({
      ...member,
      keptRowNumber,
      message: `Exact duplicate — row ${keptRowNumber} was kept instead`,
    });
  }
}

const skippedRows = [...ignoredRows, ...errorRows, ...mergedRows].sort(
  (left, right) => left.rowNumber - right.rowNumber,
);

const uniqueListings = groups.size;

console.log(`File: ${fileName}`);
console.log(`Columns: ${columns.map((column) => column.label).join(" | ")}`);
console.log(`Auto column map: ${JSON.stringify(columnMap)}`);
console.log(`Total rows: ${rows.length.toLocaleString()}`);
console.log(`Ignored: ${ignoredRows.length.toLocaleString()}`);
console.log(`Errors: ${errorRows.length.toLocaleString()}`);
console.log(`Merged duplicates: ${mergedRows.length.toLocaleString()}`);
console.log(`Would create: ${uniqueListings.toLocaleString()}`);
console.log(
  `Check: ${uniqueListings + mergedRows.length + ignoredRows.length + errorRows.length} = ${rows.length}`,
);

const reportPath = resolve(filePath).replace(/\.[^.]+$/, "") + "-import-skipped.csv";
writeFileSync(reportPath, buildSkippedRowsCsv(skippedRows));
console.log(`\nWrote skipped-row report: ${reportPath}`);

if (mergedRows.length > 0) {
  console.log("\nFirst 10 merged rows:");
  for (const row of mergedRows.slice(0, 10)) {
    console.log(
      `  Row ${row.rowNumber} → kept row ${row.keptRowNumber}: ${row.mpn} | ${row.manufacturer} | qty ${row.quantity} | price ${row.price || "—"}`,
    );
  }
}
