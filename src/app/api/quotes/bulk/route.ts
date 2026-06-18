import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createBulkRfqJob, enqueueBulkRfqJob } from "@/lib/bulk-rfq";
import { getClientIp } from "@/lib/rate-limit";
import { verifyTurnstileToken, isTurnstileConfigured } from "@/lib/turnstile";
import { createBulkRfqSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = createBulkRfqSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid bulk RFQ request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (parsed.data.website) {
      return NextResponse.json(
        { error: "Bulk RFQ request rejected" },
        { status: 400 },
      );
    }

    const ip = getClientIp(request.headers);
    const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
    if (!turnstileOk) {
      return NextResponse.json(
        {
          error: isTurnstileConfigured()
            ? "Please complete the security check and try again."
            : "Security verification failed.",
        },
        { status: 400 },
      );
    }

    const user = await getSessionUser();
    const { turnstileToken: _token, website: _honeypot, ...payload } = parsed.data;

    const job = await createBulkRfqJob(payload, { userId: user?.id });
    enqueueBulkRfqJob(job.id);

    return NextResponse.json(
      {
        jobId: job.id,
        status: job.status,
        totalListings: job.totalListings,
        totalVendors: job.totalVendors,
        message:
          "Your quote requests are being sent. Suppliers receive one bundled email each.",
      },
      { status: 202 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to queue bulk RFQ";

    console.error("Failed to queue bulk RFQ:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
