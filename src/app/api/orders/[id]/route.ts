import { NextResponse } from "next/server";
import {
  authErrorResponse,
  canViewBuyerResource,
  getSessionUser,
  isAuthError,
  requireOwnedCompany,
} from "@/lib/auth";
import { updateOrderStatusForCompany } from "@/lib/company-inbox";
import { getOrderById } from "@/lib/orders";
import { updateOrderStatusSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const user = await getSessionUser();

    if (
      !canViewBuyerResource(
        user,
        {
          userId: order.userId,
          buyerEmail: order.buyerEmail,
          accessToken: order.accessToken,
          listing: { companyId: order.listing.companyId },
        },
        token,
      )
    ) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to load order:", error);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { company } = await requireOwnedCompany();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const order = await updateOrderStatusForCompany(
      id,
      company.id,
      parsed.data.status,
    );

    return NextResponse.json(order);
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    const message =
      error instanceof Error ? error.message : "Failed to update order";
    const status = message.includes("not found")
      ? 404
      : message.includes("Cannot change")
        ? 400
        : 500;

    if (status === 500) {
      console.error("Failed to update order:", error);
    }

    return NextResponse.json({ error: message }, { status });
  }
}
