import { appUrl, sendEmail } from "@/lib/email";
import { formatPrice } from "@/lib/format";

type OrderNotification = {
  id: string;
  accessToken: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany: string | null;
  quantity: number;
  totalPrice: string;
  currency: string;
  notes: string | null;
  listing: {
    mpn: string;
    manufacturer: string;
    company: {
      name: string;
      email: string;
    };
  };
};

type QuoteNotification = {
  id: string;
  accessToken: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany: string | null;
  quantity: number;
  notes: string | null;
  listing: {
    mpn: string;
    manufacturer: string;
    company: {
      name: string;
      email: string;
    };
  };
};

export async function notifyOrderPlaced(order: OrderNotification): Promise<void> {
  const partLabel = `${order.listing.mpn} (${order.listing.manufacturer})`;
  const total = formatPrice(order.totalPrice, order.currency);
  const orderUrl = appUrl(`/orders/${order.id}?token=${order.accessToken}`);

  await Promise.all([
    sendEmail({
      to: order.buyerEmail,
      subject: `Order confirmation: ${order.listing.mpn}`,
      text: [
        `Hi ${order.buyerName},`,
        "",
        `Your order for ${partLabel} has been placed.`,
        `Quantity: ${order.quantity}`,
        `Total: ${total}`,
        `Supplier: ${order.listing.company.name}`,
        "",
        `View your order: ${orderUrl}`,
        "",
        order.notes ? `Your notes: ${order.notes}` : "",
        "",
        "The supplier has been notified and will follow up to confirm fulfillment.",
      ]
        .filter(Boolean)
        .join("\n"),
    }),
    sendEmail({
      to: order.listing.company.email,
      subject: `New order: ${order.listing.mpn}`,
      text: [
        `You received a new order on USParts.`,
        "",
        `Part: ${partLabel}`,
        `Quantity: ${order.quantity}`,
        `Total: ${total}`,
        "",
        `Buyer: ${order.buyerName}`,
        `Email: ${order.buyerEmail}`,
        order.buyerCompany ? `Company: ${order.buyerCompany}` : "",
        order.notes ? `Notes: ${order.notes}` : "",
        "",
        `Order ID: ${order.id}`,
        `View order: ${orderUrl}`,
      ]
        .filter(Boolean)
        .join("\n"),
    }),
  ]);
}

export async function notifyQuoteRequested(quote: QuoteNotification): Promise<void> {
  const partLabel = `${quote.listing.mpn} (${quote.listing.manufacturer})`;
  const quoteUrl = appUrl(`/quotes/${quote.id}?token=${quote.accessToken}`);

  await Promise.all([
    sendEmail({
      to: quote.buyerEmail,
      subject: `Quote request sent: ${quote.listing.mpn}`,
      text: [
        `Hi ${quote.buyerName},`,
        "",
        `Your quote request for ${partLabel} has been sent to ${quote.listing.company.name}.`,
        `Quantity requested: ${quote.quantity}`,
        "",
        quote.notes ? `Your notes: ${quote.notes}` : "",
        "",
        `View request: ${quoteUrl}`,
        "",
        "The supplier will respond to you directly.",
      ]
        .filter(Boolean)
        .join("\n"),
    }),
    sendEmail({
      to: quote.listing.company.email,
      subject: `RFQ: ${quote.listing.mpn}`,
      text: [
        `You received a quote request on USParts.`,
        "",
        `Part: ${partLabel}`,
        `Quantity requested: ${quote.quantity}`,
        "",
        `Buyer: ${quote.buyerName}`,
        `Email: ${quote.buyerEmail}`,
        quote.buyerCompany ? `Company: ${quote.buyerCompany}` : "",
        quote.notes ? `Notes: ${quote.notes}` : "",
        "",
        `Request ID: ${quote.id}`,
        `View request: ${quoteUrl}`,
      ]
        .filter(Boolean)
        .join("\n"),
    }),
  ]);
}

export async function notifyPasswordReset(input: {
  email: string;
  token: string;
}): Promise<void> {
  const resetUrl = appUrl(`/reset-password?token=${input.token}`);

  await sendEmail({
    to: input.email,
    subject: "Reset your USParts password",
    text: [
      "You requested a password reset for your USParts account.",
      "",
      `Reset your password: ${resetUrl}`,
      "",
      "This link expires in 1 hour. If you did not request this, you can ignore this email.",
    ].join("\n"),
  });
}

export async function notifyCompanyInvite(input: {
  email: string;
  companyName: string;
  role: string;
  invitedByName: string | null;
  invitedByEmail: string;
  token: string;
}): Promise<void> {
  const inviteUrl = appUrl(`/invite/${input.token}`);
  const roleLabel = input.role === "ADMIN" ? "team admin" : "team member";
  const invitedBy = input.invitedByName?.trim() || input.invitedByEmail;

  await sendEmail({
    to: input.email,
    subject: `You're invited to join ${input.companyName} on USParts`,
    text: [
      `Hi,`,
      "",
      `${invitedBy} invited you to join ${input.companyName} on USParts as a ${roleLabel}.`,
      "",
      `Accept the invite: ${inviteUrl}`,
      "",
      `Sign in or create an account with ${input.email} to accept.`,
      "",
      "This invite expires in 7 days.",
    ].join("\n"),
  });
}
