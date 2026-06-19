import { NextResponse } from "next/server";
import { bulkSearchListings } from "@/lib/listings";
import { bulkSearchSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bulkSearchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid bulk search request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const results = await bulkSearchListings(parsed.data);
  return NextResponse.json(results);
}
