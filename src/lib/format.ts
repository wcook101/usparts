import type {
  OrderStatus,
  PartCategory,
  PartCondition,
} from "@/generated/prisma/client";

export const CATEGORY_LABELS: Record<PartCategory, string> = {
  SEMICONDUCTOR: "Semiconductor",
  PASSIVE: "Passive",
  CONNECTOR: "Connector",
  INTEGRATED_CIRCUIT: "Integrated Circuit",
  POWER: "Power",
  SENSOR: "Sensor",
  MEMORY: "Memory",
  DISPLAY: "Display",
  RF_WIRELESS: "RF / Wireless",
  OTHER: "Other",
};

export const CONDITION_LABELS: Record<PartCondition, string> = {
  NEW: "New",
  REFURBISHED: "Refurbished",
  USED: "Used",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  FULFILLED: "Fulfilled",
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Accepts "aplusindustry.com" and normalizes to "https://aplusindustry.com". */
export function normalizeWebsiteUrl(value: string | undefined | null): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidWebsiteUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

type PriceLike = number | string | { toString(): string } | null | undefined;

function toPriceNumber(price: PriceLike): number | null {
  if (price == null || price === "") {
    return null;
  }

  const unitPrice =
    typeof price === "number"
      ? price
      : typeof price === "string"
        ? Number(price)
        : Number(price.toString());

  return Number.isFinite(unitPrice) ? unitPrice : null;
}

export function hasListingPrice(price: PriceLike): boolean {
  const unitPrice = toPriceNumber(price);
  return unitPrice != null && unitPrice > 0;
}

export function canBuyListingNow(price: PriceLike, quantity: number): boolean {
  return hasListingPrice(price) && quantity > 0;
}

export function calculateLineTotal(
  unitPrice: number | string,
  quantity: number,
): number {
  const price = typeof unitPrice === "string" ? Number(unitPrice) : unitPrice;
  return price * quantity;
}

export function formatPrice(price: number | string, currency = "USD"): string {
  const amount = typeof price === "string" ? Number(price) : price;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function formatListingPrice(
  price: PriceLike,
  currency = "USD",
): string {
  if (!hasListingPrice(price)) {
    return "Price on request";
  }

  const amount = toPriceNumber(price);
  return formatPrice(amount ?? 0, currency);
}

export function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat("en-US").format(quantity);
}

type InventoryLocationLike = {
  label?: string | null;
  city: string;
  state?: string | null;
  country?: string | null;
};

export function formatInventoryLocation(location: InventoryLocationLike): string {
  const place = [location.city, location.state, location.country]
    .filter(Boolean)
    .join(", ");

  if (location.label?.trim()) {
    return `${location.label.trim()} — ${place}`;
  }

  return place;
}
