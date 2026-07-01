export const MAX_IMPORT_ROWS = 300_000;
export const IMPORT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type ImportCooldownStatus = {
  allowed: boolean;
  retryAt?: Date;
  hoursRemaining?: number;
};

export function getImportCooldownStatus(
  lastImportAt: Date | string | null | undefined,
  now = Date.now(),
): ImportCooldownStatus {
  if (!lastImportAt) {
    return { allowed: true };
  }

  const lastImportTime = new Date(lastImportAt).getTime();
  const elapsed = now - lastImportTime;

  if (elapsed >= IMPORT_COOLDOWN_MS) {
    return { allowed: true };
  }

  const retryAt = new Date(lastImportTime + IMPORT_COOLDOWN_MS);
  const hoursRemaining = Math.max(
    1,
    Math.ceil((IMPORT_COOLDOWN_MS - elapsed) / (1000 * 60 * 60)),
  );

  return {
    allowed: false,
    retryAt,
    hoursRemaining,
  };
}

export function assertImportAllowed(
  lastImportAt: Date | string | null | undefined,
): void {
  const status = getImportCooldownStatus(lastImportAt);

  if (!status.allowed && status.retryAt) {
    throw new Error(
      `A fully successful import was completed recently. You can run another import after ${status.retryAt.toLocaleString()}. Imports with any row errors can be retried immediately.`,
    );
  }
}

export function formatImportCooldownMessage(status: ImportCooldownStatus): string {
  if (status.allowed || !status.retryAt) {
    return "";
  }

  return `This company completed a fully successful import recently. Next import available after ${status.retryAt.toLocaleString()} (about ${status.hoursRemaining} hour(s) from now).`;
}

export function isCleanImportResult(result: {
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  ignoredRows?: number;
}): boolean {
  const ignored = result.ignoredRows ?? 0;
  const importedRows = result.totalRows - ignored;

  return (
    importedRows > 0 &&
    result.skipped === 0 &&
    result.created + result.updated === importedRows
  );
}

export function resolveLastImportAtAfterImport(result: {
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
}): Date | null {
  return isCleanImportResult(result) ? new Date() : null;
}
