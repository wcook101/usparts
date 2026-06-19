import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin";
import { AuthError } from "@/lib/auth/errors";
import {
  isSupportedImportFileName,
  readImportFileBytes,
  supportedImportFormatsLabel,
} from "@/lib/import-file";
import { previewImportContent } from "@/lib/inventory-import";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requirePlatformAdmin();

    const formData = await request.formData();
    const file = formData.get("file");
    const companyId = String(formData.get("companyId") ?? "").trim();

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

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload an inventory file" }, { status: 400 });
    }

    if (!isSupportedImportFileName(file.name)) {
      return NextResponse.json(
        { error: `Only ${supportedImportFormatsLabel()} files are supported` },
        { status: 400 },
      );
    }

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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Failed to preview import file";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
