import { appUrl, sendEmail } from "@/lib/email";
import { formatPrice } from "@/lib/format";
import { SUPPORT_EMAIL } from "@/lib/site";

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

export async function notifySupportContact(input: {
  name: string;
  email: string;
  company?: string;
  message: string;
}): Promise<void> {
  const subject = `Support request from ${input.name}`;
  const lines = [
    "New support message from the USParts help form.",
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Company: ${input.company?.trim() || "—"}`,
    "",
    "Message:",
    input.message,
    "",
    `Reply directly to ${input.email} to respond.`,
  ];

  await sendEmail({
    to: SUPPORT_EMAIL,
    replyTo: input.email,
    subject,
    text: lines.join("\n"),
  });
}

type BulkRfqVendorLine = {
  quoteId: string;
  accessToken: string;
  mpn: string;
  manufacturer: string;
  quantity: number;
  listedQuantity: number;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildBulkRfqVendorTableHtml(lines: BulkRfqVendorLine[]): string {
  const rows = lines
    .map((line) => {
      const quoteUrl = appUrl(`/quotes/${line.quoteId}?token=${line.accessToken}`);
      return `<tr>
  <td style="padding:10px 12px;border:1px solid #e2e8f0;font-family:Consolas,Monaco,monospace;font-size:13px;color:#0f172a;">${escapeHtml(line.mpn)}</td>
  <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#334155;">${escapeHtml(line.manufacturer || "—")}</td>
  <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;text-align:right;">${line.quantity.toLocaleString()}</td>
  <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;color:#64748b;text-align:right;">${line.listedQuantity.toLocaleString()}</td>
  <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;"><a href="${quoteUrl}" style="color:#2563eb;text-decoration:none;">View quote</a></td>
</tr>`;
    })
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0;background:#ffffff;">
  <thead>
    <tr style="background:#f8fafc;">
      <th align="left" style="padding:10px 12px;border:1px solid #e2e8f0;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#475569;">Part Number</th>
      <th align="left" style="padding:10px 12px;border:1px solid #e2e8f0;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#475569;">Manufacturer</th>
      <th align="right" style="padding:10px 12px;border:1px solid #e2e8f0;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#475569;">Requested Qty</th>
      <th align="right" style="padding:10px 12px;border:1px solid #e2e8f0;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#475569;">Your Stock</th>
      <th align="left" style="padding:10px 12px;border:1px solid #e2e8f0;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#475569;">Link</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
}

export async function notifyBulkRfqVendorBundle(input: {
  buyerName: string;
  buyerEmail: string;
  buyerCompany: string | null;
  notes: string | null;
  company: {
    name: string;
    email: string;
  };
  lines: BulkRfqVendorLine[];
}): Promise<void> {
  const partRowsText = input.lines
    .map((line) => {
      const quoteUrl = appUrl(`/quotes/${line.quoteId}?token=${line.accessToken}`);
      return [
        `- ${line.mpn} (${line.manufacturer})`,
        `  Requested qty: ${line.quantity.toLocaleString()}`,
        `  Your stock: ${line.listedQuantity.toLocaleString()}`,
        `  View: ${quoteUrl}`,
      ].join("\n");
    })
    .join("\n\n");

  const buyerLines = [
    `Buyer: ${input.buyerName}`,
    `Email: ${input.buyerEmail}`,
    input.buyerCompany ? `Company: ${input.buyerCompany}` : "",
    input.notes ? `Notes: ${input.notes}` : "",
  ].filter(Boolean);

  const text = [
    `You received a bulk quote request on USParts.`,
    "",
    ...buyerLines,
    "",
    "Parts requested:",
    partRowsText,
    "",
    "Reply to the buyer directly to provide pricing and availability.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb;">USParts bulk RFQ</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">Quote request for ${input.lines.length} part${input.lines.length === 1 ? "" : "s"}</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569;">${escapeHtml(input.company.name)} received a bundled request from a buyer on USParts. All requested lines are listed below.</p>
      <div style="margin:0 0 20px;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;line-height:1.7;">
        ${buyerLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}
      </div>
      ${buildBulkRfqVendorTableHtml(input.lines)}
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#64748b;">Reply directly to the buyer to provide pricing and availability.</p>
    </div>
  </body>
</html>`;

  await sendEmail({
    to: input.company.email,
    replyTo: input.buyerEmail,
    subject: `Bulk RFQ: ${input.lines.length} part${input.lines.length === 1 ? "" : "s"} requested`,
    text,
    html,
  });
}

export async function notifyBulkRfqBuyerConfirmation(input: {
  buyerName: string;
  buyerEmail: string;
  totalListings: number;
  totalVendors: number;
  notes: string | null;
  lines: Array<{
    quoteId: string;
    accessToken: string;
    mpn: string;
    manufacturer: string;
    supplierName: string;
    quantity: number;
    listedQuantity: number;
  }>;
}): Promise<void> {
  const summary = input.lines
    .map((line) => {
      const quoteUrl = appUrl(`/quotes/${line.quoteId}?token=${line.accessToken}`);
      return `- ${line.mpn} (${line.manufacturer}) → ${line.supplierName} · Qty ${line.quantity.toLocaleString()} (listed ${line.listedQuantity.toLocaleString()})\n  ${quoteUrl}`;
    })
    .join("\n");

  await sendEmail({
    to: input.buyerEmail,
    subject: `Bulk quote requests sent (${input.totalListings} parts)`,
    text: [
      `Hi ${input.buyerName},`,
      "",
      `Your bulk quote request has been sent to ${input.totalVendors} supplier${input.totalVendors === 1 ? "" : "s"} covering ${input.totalListings} listing${input.totalListings === 1 ? "" : "s"}.`,
      input.notes ? `\nYour notes: ${input.notes}` : "",
      "",
      "Summary:",
      summary,
      "",
      "Suppliers will respond to you directly.",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
