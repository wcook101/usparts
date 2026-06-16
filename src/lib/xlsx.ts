import * as XLSX from "xlsx";
import type { ParsedColumn, ParsedCsv } from "@/lib/csv";

function cellToString(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).trim();
}

export function parseXlsx(data: ArrayBuffer | Uint8Array | Buffer): ParsedCsv {
  const workbook = XLSX.read(data, {
    type: "buffer",
    cellDates: true,
    raw: false,
  });

  if (workbook.SheetNames.length === 0) {
    return { columns: [], rows: [] };
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  if (table.length === 0) {
    return { columns: [], rows: [] };
  }

  const headerRow = (table[0] ?? []).map((cell) => cellToString(cell));
  const columns: ParsedColumn[] = headerRow.map((header, index) => ({
    key: `col_${index}`,
    label: header || `Column ${index + 1}`,
    index,
  }));

  const rows: Record<string, string>[] = [];

  for (let rowIndex = 1; rowIndex < table.length; rowIndex += 1) {
    const values = (table[rowIndex] ?? []).map((cell) => cellToString(cell));
    if (values.every((value) => !value)) {
      continue;
    }

    const row: Record<string, string> = {};
    columns.forEach((column) => {
      row[column.key] = values[column.index] ?? "";
    });
    rows.push(row);
  }

  return { columns, rows };
}
