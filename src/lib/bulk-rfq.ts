import { db } from "@/lib/db";
import {
  notifyBulkRfqBuyerConfirmation,
  notifyBulkRfqVendorBundle,
} from "@/lib/notifications";
import type { CreateBulkRfqInput } from "@/lib/validations";

const VENDOR_EMAIL_DELAY_MS = 2_500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type BulkRfqJobSummary = {
  id: string;
  status: string;
  totalListings: number;
  totalVendors: number;
  emailsSent: number;
  errorMessage: string | null;
  createdAt: Date;
};

export async function createBulkRfqJob(
  input: CreateBulkRfqInput,
  options?: { userId?: string },
): Promise<BulkRfqJobSummary> {
  const uniqueListingIds = [...new Set(input.listingIds)];

  const listings = await db.partListing.findMany({
    where: {
      id: { in: uniqueListingIds },
      isActive: true,
    },
    include: { company: true },
  });

  if (listings.length === 0) {
    throw new Error("No valid listings selected for quote requests");
  }

  if (listings.length !== uniqueListingIds.length) {
    throw new Error("One or more selected listings are no longer available");
  }

  const vendorIds = new Set(listings.map((listing) => listing.companyId));

  const job = await db.bulkRfqJob.create({
    data: {
      userId: options?.userId ?? null,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail.toLowerCase(),
      buyerCompany: input.buyerCompany || null,
      notes: input.notes || null,
      listingIds: listings.map((listing) => listing.id),
      totalListings: listings.length,
      totalVendors: vendorIds.size,
    },
  });

  return job;
}

export async function getBulkRfqJob(jobId: string): Promise<BulkRfqJobSummary | null> {
  return db.bulkRfqJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      totalListings: true,
      totalVendors: true,
      emailsSent: true,
      errorMessage: true,
      createdAt: true,
    },
  });
}

export function enqueueBulkRfqJob(jobId: string) {
  setImmediate(() => {
    void processBulkRfqJob(jobId);
  });
}

export async function processBulkRfqJob(jobId: string): Promise<void> {
  const claimed = await db.bulkRfqJob.updateMany({
    where: { id: jobId, status: "PENDING" },
    data: { status: "SENDING" },
  });

  if (claimed.count === 0) {
    return;
  }

  const job = await db.bulkRfqJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return;
  }

  try {
    const listings = await db.partListing.findMany({
      where: {
        id: { in: job.listingIds },
        isActive: true,
      },
      include: { company: true, inventoryLocation: true },
      orderBy: [{ companyId: "asc" }, { mpn: "asc" }],
    });

    if (listings.length === 0) {
      throw new Error("Selected listings are no longer available");
    }

    const quotes = await db.$transaction(async (tx) => {
      const created = [];

      for (const listing of listings) {
        created.push(
          await tx.quoteRequest.create({
            data: {
              listingId: listing.id,
              userId: job.userId,
              buyerName: job.buyerName,
              buyerEmail: job.buyerEmail,
              buyerCompany: job.buyerCompany,
              quantity: Math.max(1, listing.quantity),
              notes: job.notes,
            },
            include: {
              listing: {
                include: {
                  company: true,
                  inventoryLocation: true,
                },
              },
            },
          }),
        );
      }

      return created;
    });

    const quotesByCompany = new Map<string, typeof quotes>();
    for (const quote of quotes) {
      const companyId = quote.listing.companyId;
      const bucket = quotesByCompany.get(companyId) ?? [];
      bucket.push(quote);
      quotesByCompany.set(companyId, bucket);
    }

    let emailsSent = 0;
    for (const companyQuotes of quotesByCompany.values()) {
      const company = companyQuotes[0]?.listing.company;
      if (!company) {
        continue;
      }

      await notifyBulkRfqVendorBundle({
        buyerName: job.buyerName,
        buyerEmail: job.buyerEmail,
        buyerCompany: job.buyerCompany,
        notes: job.notes,
        company: {
          name: company.name,
          email: company.email,
        },
        lines: companyQuotes.map((quote) => ({
          quoteId: quote.id,
          accessToken: quote.accessToken,
          mpn: quote.listing.mpn,
          manufacturer: quote.listing.manufacturer,
          quantity: quote.quantity,
          listedQuantity: quote.listing.quantity,
        })),
      });

      emailsSent += 1;
      await sleep(VENDOR_EMAIL_DELAY_MS);
    }

    await notifyBulkRfqBuyerConfirmation({
      buyerName: job.buyerName,
      buyerEmail: job.buyerEmail,
      totalListings: quotes.length,
      totalVendors: quotesByCompany.size,
      lines: quotes.map((quote) => ({
        quoteId: quote.id,
        accessToken: quote.accessToken,
        mpn: quote.listing.mpn,
        manufacturer: quote.listing.manufacturer,
        supplierName: quote.listing.company.name,
        quantity: quote.quantity,
      })),
      notes: job.notes,
    });

    await db.bulkRfqJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        emailsSent,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bulk RFQ processing failed";

    await db.bulkRfqJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });

    console.error(`Bulk RFQ job ${jobId} failed:`, error);
  }
}
