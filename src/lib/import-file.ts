export const SUPPORTED_IMPORT_EXTENSIONS = [
  ".csv",
  ".json",
  ".xlsx",
  ".xls",
] as const;

export type ImportFileFormat = "csv" | "json" | "xlsx";

export function getImportFileFormat(fileName: string): ImportFileFormat | null {
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith(".json")) {
    return "json";
  }

  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    return "xlsx";
  }

  if (lowerName.endsWith(".csv")) {
    return "csv";
  }

  return null;
}

export function isSupportedImportFileName(fileName: string): boolean {
  return getImportFileFormat(fileName) != null;
}

export function supportedImportAcceptAttribute(): string {
  return SUPPORTED_IMPORT_EXTENSIONS.join(",");
}

export function supportedImportFormatsLabel(): string {
  return "CSV, Excel (.xlsx/.xls), or JSON";
}

export async function readImportFileBytes(file: Blob): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

export function decodeImportText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "");
}

export function createImportUploadFile(
  fileName: string,
  bytes: Uint8Array,
  mimeType = "application/octet-stream",
): File {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

  return new File([buffer], fileName, { type: mimeType });
}
