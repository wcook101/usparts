export type ParsedColumn = {
  key: string;
  label: string;
  index: number;
};

export type ParsedCsv = {
  columns: ParsedColumn[];
  rows: Record<string, string>[];
};

/** Minimal CSV parser for supplier inventory files. */
export function parseCsv(content: string): ParsedCsv {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) {
    return { columns: [], rows: [] };
  }

  const headerValues = parseCsvLine(lines[0]);
  const columns: ParsedColumn[] = headerValues.map((header, index) => ({
    key: `col_${index}`,
    label: header.trim() || `Column ${index + 1}`,
    index,
  }));

  const rows: Record<string, string>[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = parseCsvLine(lines[lineIndex]);
    if (values.every((value) => !value.trim())) continue;

    const row: Record<string, string> = {};
    columns.forEach((column) => {
      row[column.key] = values[column.index]?.trim() ?? "";
    });
    rows.push(row);
  }

  return { columns, rows };
}

export function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
