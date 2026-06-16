import { db } from "@/lib/db";
import { calculateLineTotal } from "@/lib/format";
import { notifyOrderPlaced } from "@/lib/notifications";
import type { CreateOrderInput } from "@/lib/validations";

export async function getOrderById(id: string) {
  return db.order.findUnique({
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

export async function getOrdersForUser(userId: string, userEmail: string) {
  return db.order.findMany({
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

export async function placeOrder(
  input: CreateOrderInput,
  options?: { userId?: string },
) {
  return db.$transaction(async (tx) => {
    const listing = await tx.partListing.findUnique({
      where: { id: input.listingId },
      include: { company: true },
    });

    if (!listing || !listing.isActive) {
      throw new Error("Listing not found");
    }

    const unitPrice = listing.price != null ? Number(listing.price) : 0;
    if (unitPrice <= 0) {
      throw new Error("This part is not available for immediate purchase");
    }

    if (input.quantity > listing.quantity) {
      throw new Error(`Only ${listing.quantity} units are available`);
    }

    const totalPrice = calculateLineTotal(unitPrice, input.quantity);

    const order = await tx.order.create({
      data: {
        listingId: listing.id,
        userId: options?.userId ?? null,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail.toLowerCase(),
        buyerCompany: input.buyerCompany || null,
        quantity: input.quantity,
        unitPrice: unitPrice,
        currency: listing.currency,
        totalPrice,
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

    await tx.partListing.update({
      where: { id: listing.id },
      data: { quantity: listing.quantity - input.quantity },
    });

    return order;
  }).then(async (order) => {
    try {
      await notifyOrderPlaced({
        id: order.id,
        accessToken: order.accessToken,
        buyerName: order.buyerName,
        buyerEmail: order.buyerEmail,
        buyerCompany: order.buyerCompany,
        quantity: order.quantity,
        totalPrice: order.totalPrice.toString(),
        currency: order.currency,
        notes: order.notes,
        listing: {
          mpn: order.listing.mpn,
          manufacturer: order.listing.manufacturer,
          company: {
            name: order.listing.company.name,
            email: order.listing.company.email,
          },
        },
      });
    } catch (error) {
      console.error("Order notification failed:", error);
    }

    return order;
  });
}
