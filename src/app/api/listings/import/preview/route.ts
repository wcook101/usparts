import { NextResponse } from "next/server";
import {
  isSupportedImportFileName,
  readImportFileBytes,
  supportedImportFormatsLabel,
} from "@/lib/import-file";
import { previewImportContent } from "@/lib/inventory-import";
import { assertImportAllowed } from "@/lib/import-limits";
import {
  authErrorResponse,
  isAuthError,
  requireOwnedCompany,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { company } = await requireOwnedCompany();

    const formData = await request.formData();
    const file = formData.get("file");
    const requestedCompanyId = String(formData.get("companyId") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload an inventory file" }, { status: 400 });
    }

    if (!isSupportedImportFileName(file.name)) {
      return NextResponse.json(
        { error: `Only ${supportedImportFormatsLabel()} files are supported` },
        { status: 400 },
      );
    }

    if (requestedCompanyId && requestedCompanyId !== company.id) {
      return NextResponse.json(
        { error: "You can only preview imports for your own company" },
        { status: 403 },
      );
    }

    assertImportAllowed(company.lastImportAt);

    const bytes = await readImportFileBytes(file);
    const preview = previewImportContent(file.name, bytes);

    if (preview.columns.length === 0) {
      return NextResponse.json(
        { error: "The file did not contain any columns to match" },
        { status: 400 },
      );
    }

    return NextResponse.json(preview);
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    const message =
      error instanceof Error ? error.message : "Failed to preview import file";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
