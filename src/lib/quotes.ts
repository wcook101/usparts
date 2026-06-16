import { db } from "@/lib/db";
import type { CreateQuoteInput } from "@/lib/validations";

export async function getQuoteById(id: string) {
  return db.quoteRequest.findUnique({
    where: { id },
    include: {
      listing: {
        include: {
          company: true,
          inventoryLocation: true,
        },
      },
    },
  });
}

export async function getQuotesForUser(userId: string, userEmail: string) {
  return db.quoteRequest.findMany({
    where: {
      OR: [{ userId }, { buyerEmail: userEmail.toLowerCase() }],
    },
    include: {
      listing: {
        include: {
          company: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function placeQuoteRequest(
  input: CreateQuoteInput,
  options?: { userId?: string },
) {
  const listing = await db.partListing.findUnique({
    where: { id: input.listingId },
    include: { company: true },
  });

  if (!listing || !listing.isActive) {
    throw new Error("Listing not found");
  }

  return db.quoteRequest.create({
    data: {
      listingId: listing.id,
      userId: options?.userId ?? null,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail.toLowerCase(),
      buyerCompany: input.buyerCompany || null,
      quantity: input.quantity,
      notes: input.notes || null,
    },
    include: {
      listing: {
        include: {
          company: true,
          inventoryLocation: true,
        },
      },
    },
  });
}
