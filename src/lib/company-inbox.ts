import type { OrderStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "FULFILLED"],
  CONFIRMED: ["FULFILLED", "CANCELLED"],
  FULFILLED: [],
  CANCELLED: [],
};

const QUOTE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "FULFILLED"],
  CONFIRMED: ["FULFILLED", "CANCELLED"],
  FULFILLED: [],
  CANCELLED: [],
};

function assertStatusTransition(
  current: OrderStatus,
  next: OrderStatus,
  transitions: Record<OrderStatus, OrderStatus[]>,
) {
  if (current === next) {
    return;
  }

  if (!transitions[current].includes(next)) {
    throw new Error(`Cannot change status from ${current} to ${next}`);
  }
}

export async function getOrdersForCompany(companyId: string) {
  return db.order.findMany({
    where: {
      listing: { companyId },
    },
    include: {
      listing: {
        include: {
          company: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getQuotesForCompany(companyId: string) {
  return db.quoteRequest.findMany({
    where: {
      listing: { companyId },
    },
    include: {
      listing: {
        include: {
          company: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function updateOrderStatusForCompany(
  orderId: string,
  companyId: string,
  status: OrderStatus,
) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        listing: { companyId },
      },
      include: { listing: true },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const previousStatus = order.status;
    assertStatusTransition(previousStatus, status, ORDER_TRANSITIONS);

    if (status === "CANCELLED" && previousStatus !== "CANCELLED") {
      await tx.partListing.update({
        where: { id: order.listingId },
        data: { quantity: order.listing.quantity + order.quantity },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        listing: {
          include: { company: true },
        },
      },
    });
  });
}

export async function updateQuoteStatusForCompany(
  quoteId: string,
  companyId: string,
  status: OrderStatus,
) {
  const quote = await db.quoteRequest.findFirst({
    where: {
      id: quoteId,
      listing: { companyId },
    },
  });

  if (!quote) {
    throw new Error("Quote request not found");
  }

  assertStatusTransition(quote.status, status, QUOTE_TRANSITIONS);

  return db.quoteRequest.update({
    where: { id: quoteId },
    data: { status },
    include: {
      listing: {
        include: { company: true },
      },
    },
  });
}
