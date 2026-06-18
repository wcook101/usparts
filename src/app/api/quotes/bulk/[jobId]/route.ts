import { NextResponse } from "next/server";
import { getBulkRfqJob } from "@/lib/bulk-rfq";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const job = await getBulkRfqJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Bulk RFQ job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
