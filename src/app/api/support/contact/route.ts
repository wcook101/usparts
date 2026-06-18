import { NextResponse } from "next/server";
import { formatEmailError, getEmailProvider } from "@/lib/email";
import { notifySupportContact } from "@/lib/notifications";
import { supportContactSchema } from "@/lib/validations";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    if (getEmailProvider() === "dev") {
      return NextResponse.json(
        {
          error:
            "Email is not configured on the server yet. Please email support@usparts.us directly.",
        },
        { status: 503 },
      );
    }

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
    console.error("Support contact failed:", formatEmailError(error), error);
    return NextResponse.json(
      {
        error:
          "We could not send your message right now. Please email support@usparts.us directly and we will help you there.",
      },
      { status: 500 },
    );
  }
}
