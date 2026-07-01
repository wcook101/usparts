import { NextResponse } from "next/server";
import {
  importInventory,
  importInventoryFromJson,
} from "@/lib/import-inventory";
import type { ColumnMap } from "@/lib/inventory-import";
import {
  isSupportedImportFileName,
  readImportFileBytes,
  supportedImportFormatsLabel,
} from "@/lib/import-file";
import {
  authErrorResponse,
  isAuthError,
  requireOwnedCompany,
} from "@/lib/auth";
import {
  importInventoryRequestSchema,
  importModeSchema,
} from "@/lib/validations";

export const runtime = "nodejs";
export const maxDuration = 900;

export async function POST(request: Request) {
  try {
    const { company } = await requireOwnedCompany();

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const parsed = importInventoryRequestSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid import payload", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      if (parsed.data.companyId && parsed.data.companyId !== company.id) {
        return NextResponse.json(
          { error: "You can only import inventory for your own company" },
          { status: 403 },
        );
      }

      const result = await importInventoryFromJson({
        ...parsed.data,
        companyId: company.id,
        columnMap: parsed.data.columnMap as ColumnMap | undefined,
        excludedColumns: parsed.data.excludedColumns,
      });
      return NextResponse.json(result, { status: 201 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const requestedCompanyId = String(formData.get("companyId") ?? "");
    const defaultInventoryLocationId = String(
      formData.get("defaultInventoryLocationId") ?? "",
    );
    const modeValue = String(formData.get("mode") ?? "append");
    const mode = importModeSchema.safeParse(modeValue);
    const columnMapRaw = String(formData.get("columnMap") ?? "");
    const excludedColumnsRaw = String(formData.get("excludedColumns") ?? "");
    let columnMap: ColumnMap | undefined;
    let excludedColumns: string[] | undefined;

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

    if (requestedCompanyId && requestedCompanyId !== company.id) {
      return NextResponse.json(
        { error: "You can only import inventory for your own company" },
        { status: 403 },
      );
    }

    if (!isSupportedImportFileName(file.name)) {
      return NextResponse.json(
        { error: `Only ${supportedImportFormatsLabel()} files are supported` },
        { status: 400 },
      );
    }

    const fileBytes = await readImportFileBytes(file);
    const result = await importInventory({
      companyId: company.id,
      defaultInventoryLocationId,
      mode: mode.data,
      fileName: file.name,
      fileBytes,
      columnMap,
      excludedColumns,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    const message =
      error instanceof Error ? error.message : "Failed to import inventory";
    console.error("Inventory import failed:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
