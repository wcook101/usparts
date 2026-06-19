import { db } from "@/lib/db";
import {
  notifyBulkRfqBuyerConfirmation,
  notifyBulkRfqVendorBundle,
} from "@/lib/notifications";
import type { BulkRfqItem, CreateBulkRfqInput } from "@/lib/validations";

const VENDOR_EMAIL_DELAY_MS = 2_500;

export type BulkRfqListingItem = BulkRfqItem;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseListingItems(raw: unknown): BulkRfqListingItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((entry) => {
    if (
      entry &&
      typeof entry === "object" &&
      "listingId" in entry &&
      "quantity" in entry &&
      typeof entry.listingId === "string" &&
      typeof entry.quantity === "number" &&
      entry.quantity >= 1
    ) {
      return [{ listingId: entry.listingId, quantity: entry.quantity }];
    }

    return [];
  });
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
  const uniqueItems = new Map<string, number>();
  for (const item of input.items) {
    uniqueItems.set(item.listingId, item.quantity);
  }

  const listingIds = [...uniqueItems.keys()];
  const listings = await db.partListing.findMany({
    where: {
      id: { in: listingIds },
      isActive: true,
    },
    include: { company: true },
  });

  if (listings.length === 0) {
    throw new Error("No valid listings selected for quote requests");
  }

  if (listings.length !== listingIds.length) {
    throw new Error("One or more selected listings are no longer available");
  }

  const listingItems = listings.map((listing) => ({
    listingId: listing.id,
    quantity: uniqueItems.get(listing.id) ?? 1,
  }));

  const vendorIds = new Set(listings.map((listing) => listing.companyId));

  const job = await db.bulkRfqJob.create({
    data: {
      userId: options?.userId ?? null,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail.toLowerCase(),
      buyerCompany: input.buyerCompany || null,
      notes: input.notes || null,
      listingIds: listingItems.map((item) => item.listingId),
      listingItems,
      totalListings: listingItems.length,
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
    const listingItems = parseListingItems(job.listingItems);
    const quantityByListingId = new Map(
      listingItems.length > 0
        ? listingItems.map((item) => [item.listingId, item.quantity])
        : job.listingIds.map((listingId) => [listingId, 1]),
    );

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
        const requestedQuantity = quantityByListingId.get(listing.id) ?? listing.quantity;

        created.push(
          await tx.quoteRequest.create({
            data: {
              listingId: listing.id,
              userId: job.userId,
              buyerName: job.buyerName,
              buyerEmail: job.buyerEmail,
              buyerCompany: job.buyerCompany,
              quantity: Math.max(1, requestedQuantity),
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
        listedQuantity: quote.listing.quantity,
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
