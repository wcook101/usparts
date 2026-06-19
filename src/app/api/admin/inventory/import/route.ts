import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { AuthError } from "@/lib/auth/errors";
import { importInventory } from "@/lib/import-inventory";
import type { ColumnMap } from "@/lib/inventory-import";
import {
  isSupportedImportFileName,
  readImportFileBytes,
  supportedImportFormatsLabel,
} from "@/lib/import-file";
import { importModeSchema } from "@/lib/validations";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requirePlatformAdmin();

    const formData = await request.formData();
    const file = formData.get("file");
    const companyId = String(formData.get("companyId") ?? "").trim();
    const defaultInventoryLocationId = String(
      formData.get("defaultInventoryLocationId") ?? "",
    );
    const modeValue = String(formData.get("mode") ?? "append");
    const mode = importModeSchema.safeParse(modeValue);
    const columnMapRaw = String(formData.get("columnMap") ?? "");
    const excludedColumnsRaw = String(formData.get("excludedColumns") ?? "");
    let columnMap: ColumnMap | undefined;
    let excludedColumns: string[] | undefined;

    if (!companyId) {
      return NextResponse.json({ error: "Select a company to import for" }, { status: 400 });
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (columnMapRaw) {
      try {
        columnMap = JSON.parse(columnMapRaw) as ColumnMap;
      } catch {
        return NextResponse.json({ error: "Invalid column mapping" }, { status: 400 });
      }
    }

    if (excludedColumnsRaw) {
      try {
        const parsed = JSON.parse(excludedColumnsRaw) as unknown;
        if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== "string")) {
          return NextResponse.json({ error: "Invalid excluded columns" }, { status: 400 });
        }
        excludedColumns = parsed;
      } catch {
        return NextResponse.json({ error: "Invalid excluded columns" }, { status: 400 });
      }
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload an inventory file" }, { status: 400 });
    }

    if (!defaultInventoryLocationId) {
      return NextResponse.json(
        { error: "Default inventory location is required" },
        { status: 400 },
      );
    }

    if (!mode.success) {
      return NextResponse.json({ error: "Invalid import mode" }, { status: 400 });
    }

    if (!isSupportedImportFileName(file.name)) {
      return NextResponse.json(
        { error: `Only ${supportedImportFormatsLabel()} files are supported` },
        { status: 400 },
      );
    }

    const fileBytes = await readImportFileBytes(file);
    const result = await importInventory({
      companyId,
      defaultInventoryLocationId,
      mode: mode.data,
      fileName: file.name,
      fileBytes,
      columnMap,
      excludedColumns,
      skipImportCooldown: true,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Failed to import inventory";
    console.error("Admin inventory import failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
