import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { placeOrder } from "@/lib/orders";
import { createOrderSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await getSessionUser();
    const order = await placeOrder(parsed.data, {
      userId: user?.id,
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to place order";
    const status = message.includes("not found") ? 404 : 400;

    console.error("Failed to place order:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
