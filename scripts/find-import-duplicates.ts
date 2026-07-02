import { readFileSync } from "node:fs";
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

function normalizeDateCodeKey(dateCode: string | null | undefined): string {
  return (dateCode ?? "").trim().toLowerCase();
}

function normalizePriceKey(price: number | undefined | null): string {
  if (price == null || !Number.isFinite(price)) {
    return "";
  }

  return price.toFixed(4);
}

function listingMatchKey(
  mpn: string,
  manufacturer: string,
  dateCode: string | null | undefined,
  quantity: number,
  price?: number | null,
): string {
  return [
    mpn.toLowerCase(),
    manufacturer.toLowerCase(),
    normalizeDateCodeKey(dateCode),
    String(quantity),
    normalizePriceKey(price),
  ].join("::");
}

function usage(): never {
  console.error(
    [
      "Usage: npx tsx scripts/find-import-duplicates.ts <inventory-file> [column-map.json]",
      "",
      "Finds rows with the same part number, manufacturer, date code, quantity, and price",
      "(the same rule the importer uses to merge duplicates).",
    ].join("\n"),
  );
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

type RowSample = {
  rowNumber: number;
  mpn: string;
  manufacturer: string;
  dateCode: string;
  quantity: string;
  price: string;
  description: string;
};

const groups = new Map<string, RowSample[]>();

rows.forEach((row, index) => {
  const mapped = applyColumnMap(row, activeMap);
  const normalized = normalizeImportRow(mapped, index + 1);
  if (normalized.ignored || normalized.error || !normalized.data) {
    return;
  }

  const data = normalized.data;
  const key = listingMatchKey(
    data.mpn,
    data.manufacturer,
    data.dateCode,
    data.quantity,
    data.price,
  );
  const sample: RowSample = {
    rowNumber: data.rowNumber,
    mpn: data.mpn,
    manufacturer: data.manufacturer,
    dateCode: data.dateCode ?? "",
    quantity: getFieldValue(mapped, "quantity") || String(data.quantity),
    price: getFieldValue(mapped, "price") || (data.price != null ? String(data.price) : ""),
    description: getFieldValue(mapped, "description") || data.description || "",
  };

  const bucket = groups.get(key) ?? [];
  bucket.push(sample);
  groups.set(key, bucket);
});

const duplicateGroups = [...groups.entries()]
  .filter(([, members]) => members.length > 1)
  .sort((left, right) => right[1].length - left[1].length);

const mergedRowCount = duplicateGroups.reduce(
  (total, [, members]) => total + (members.length - 1),
  0,
);

console.log(`File: ${fileName}`);
console.log(`Data rows: ${rows.length.toLocaleString()}`);
console.log(`Duplicate groups: ${duplicateGroups.length.toLocaleString()}`);
console.log(`Rows merged by importer: ${mergedRowCount.toLocaleString()}`);
console.log("");

if (duplicateGroups.length === 0) {
  console.log("No identical part + manufacturer + date code + quantity + price rows found.");
  process.exit(0);
}

const exampleCount = Math.min(3, duplicateGroups.length);
console.log(`First ${exampleCount} example group(s):\n`);

for (let index = 0; index < exampleCount; index += 1) {
  const [, members] = duplicateGroups[index]!;
  const kept = members[members.length - 1]!;

  console.log(`Example ${index + 1} — ${members.length} identical rows (importer keeps row ${kept.rowNumber}):`);
  console.log(
    `  Part: ${kept.mpn} | Manufacturer: ${kept.manufacturer || "(blank)"} | Date code: ${kept.dateCode || "(blank)"} | Qty: ${kept.quantity} | Price: ${kept.price || "(blank)"}`,
  );

  for (const member of members) {
    console.log(
      [
        `  Row ${member.rowNumber}:`,
        `qty ${member.quantity || "—"}`,
        `price ${member.price || "—"}`,
        member.description ? `desc "${member.description.slice(0, 60)}${member.description.length > 60 ? "…" : ""}"` : "",
        member.rowNumber === kept.rowNumber ? "(kept)" : "(dropped)",
      ]
        .filter(Boolean)
        .join(" · "),
    );
  }

  console.log("");
}
