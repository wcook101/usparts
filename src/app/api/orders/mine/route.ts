import { NextResponse } from "next/server";
import {
  authErrorResponse,
  isAuthError,
  requireAuth,
} from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";

export async function GET() {
  try {
    const user = await requireAuth();
    const orders = await getOrdersForUser(user.id, user.email);

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        status: order.status,
        quantity: order.quantity,
        totalPrice: order.totalPrice.toString(),
        currency: order.currency,
        createdAt: order.createdAt,
        listing: {
          id: order.listing.id,
          mpn: order.listing.mpn,
          manufacturer: order.listing.manufacturer,
          company: {
            id: order.listing.company.id,
            name: order.listing.company.name,
          },
        },
      })),
    });
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to load orders:", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
