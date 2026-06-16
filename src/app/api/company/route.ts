import { NextResponse } from "next/server";
import {
  authErrorResponse,
  isAuthError,
  requireOwnedCompany,
} from "@/lib/auth";
import { getCompanyById, updateCompanyProfile } from "@/lib/company";
import { updateCompanySchema } from "@/lib/validations";

export async function GET() {
  try {
    const { company } = await requireOwnedCompany();
    const fullCompany = await getCompanyById(company.id);

    if (!fullCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(fullCompany);
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to load company:", error);
    return NextResponse.json(
      { error: "Failed to load company" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { company } = await requireOwnedCompany();
    const body = await request.json();
    const parsed = updateCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid company data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const updated = await updateCompanyProfile(company.id, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to update company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 },
    );
  }
}
