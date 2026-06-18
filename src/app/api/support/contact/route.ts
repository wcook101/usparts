import { NextResponse } from "next/server";
import { notifySupportContact } from "@/lib/notifications";
import { supportContactSchema } from "@/lib/validations";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = supportContactSchema.safeParse(body);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Please check your contact details";

      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;

    await notifySupportContact({
      name: data.name,
      email: data.email,
      company: data.company || undefined,
      message: data.message,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Support contact failed:", error);
    return NextResponse.json(
      { error: "Failed to send your message. Please try again later." },
      { status: 500 },
    );
  }
}
