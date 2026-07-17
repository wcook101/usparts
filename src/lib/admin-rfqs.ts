import type { BulkRfqJobStatus, OrderStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type AdminRfqSingleRecord = {
  id: string;
  kind: "single";
  buyerName: string;
  buyerEmail: string;
  buyerCompany: string | null;
  quantity: number;
  notes: string | null;
  status: OrderStatus;
  createdAt: string;
  mpn: string;
  manufacturer: string | null;
  supplierName: string;
  supplierEmail: string;
  listingId: string;
  userId: string | null;
};

export type AdminRfqBulkLine = {
  listingId: string;
  mpn: string;
  manufacturer: string | null;
  quantity: number;
  supplierName: string;
  supplierEmail: string;
};

export type AdminRfqBulkRecord = {
  id: string;
  kind: "bulk";
  buyerName: string;
  buyerEmail: string;
  buyerCompany: string | null;
  notes: string | null;
  status: BulkRfqJobStatus;
  totalListings: number;
  totalVendors: number;
  emailsSent: number;
  errorMessage: string | null;
  createdAt: string;
  userId: string | null;
  lines: AdminRfqBulkLine[];
};

export type AdminRfqActivityRecord = AdminRfqSingleRecord | AdminRfqBulkRecord;

export type AdminRfqSummary = {
  totalSingle: number;
  totalBulk: number;
  last7DaysSingle: number;
  last7DaysBulk: number;
  last30DaysSingle: number;
  last30DaysBulk: number;
};

export type AdminRfqActivity = {
  summary: AdminRfqSummary;
  records: AdminRfqActivityRecord[];
};

const RECORD_LIMIT = 100;

function parseBulkQuantities(raw: unknown): Map<string, number> {
  const quantities = new Map<string, number>();
  if (!Array.isArray(raw)) {
    return quantities;
  }

  for (const entry of raw) {
    if (
      entry &&
      typeof entry === "object" &&
      "listingId" in entry &&
      "quantity" in entry &&
      typeof entry.listingId === "string" &&
      typeof entry.quantity === "number" &&
      entry.quantity >= 1
    ) {
      quantities.set(entry.listingId, entry.quantity);
    }
  }

  return quantities;
}

export async function listAdminRfqActivity(): Promise<AdminRfqActivity> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    singleQuotes,
    bulkJobs,
    totalSingle,
    totalBulk,
    last7DaysSingle,
    last7DaysBulk,
    last30DaysSingle,
    last30DaysBulk,
  ] = await Promise.all([
    db.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: RECORD_LIMIT,
      include: {
        listing: {
          select: {
            id: true,
            mpn: true,
            manufacturer: true,
            company: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    db.bulkRfqJob.findMany({
      orderBy: { createdAt: "desc" },
      take: RECORD_LIMIT,
      select: {
        id: true,
        buyerName: true,
        buyerEmail: true,
        buyerCompany: true,
        notes: true,
        status: true,
        totalListings: true,
        totalVendors: true,
        emailsSent: true,
        errorMessage: true,
        createdAt: true,
        userId: true,
        listingIds: true,
        listingItems: true,
      },
    }),
    db.quoteRequest.count(),
    db.bulkRfqJob.count(),
    db.quoteRequest.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.bulkRfqJob.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.quoteRequest.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.bulkRfqJob.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  const bulkListingIds = [...new Set(bulkJobs.flatMap((job) => job.listingIds))];
  const bulkListings =
    bulkListingIds.length === 0
      ? []
      : await db.partListing.findMany({
          where: { id: { in: bulkListingIds } },
          select: {
            id: true,
            mpn: true,
            manufacturer: true,
            company: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });
  const bulkListingById = new Map(
    bulkListings.map((listing) => [listing.id, listing]),
  );

  const singleRecords: AdminRfqSingleRecord[] = singleQuotes.map((quote) => ({
    id: quote.id,
    kind: "single",
    buyerName: quote.buyerName,
    buyerEmail: quote.buyerEmail,
    buyerCompany: quote.buyerCompany,
    quantity: quote.quantity,
    notes: quote.notes,
    status: quote.status,
    createdAt: quote.createdAt.toISOString(),
    mpn: quote.listing.mpn,
    manufacturer: quote.listing.manufacturer,
    supplierName: quote.listing.company.name,
    supplierEmail: quote.listing.company.email,
    listingId: quote.listing.id,
    userId: quote.userId,
  }));

  const bulkRecords: AdminRfqBulkRecord[] = bulkJobs.map((job) => {
    const quantities = parseBulkQuantities(job.listingItems);
    const lines: AdminRfqBulkLine[] = job.listingIds.flatMap((listingId) => {
      const listing = bulkListingById.get(listingId);
      if (!listing) {
        return [];
      }

      return [
        {
          listingId: listing.id,
          mpn: listing.mpn,
          manufacturer: listing.manufacturer,
          quantity: quantities.get(listing.id) ?? 1,
          supplierName: listing.company.name,
          supplierEmail: listing.company.email,
        },
      ];
    });

    return {
      id: job.id,
      kind: "bulk",
      buyerName: job.buyerName,
      buyerEmail: job.buyerEmail,
      buyerCompany: job.buyerCompany,
      notes: job.notes,
      status: job.status,
      totalListings: job.totalListings,
      totalVendors: job.totalVendors,
      emailsSent: job.emailsSent,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
      userId: job.userId,
      lines,
    };
  });

  const records = [...singleRecords, ...bulkRecords].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  return {
    summary: {
      totalSingle,
      totalBulk,
      last7DaysSingle,
      last7DaysBulk,
      last30DaysSingle,
      last30DaysBulk,
    },
    records: records.slice(0, RECORD_LIMIT),
  };
}
