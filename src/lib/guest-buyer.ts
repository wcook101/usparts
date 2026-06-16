export type BuyerContact = {
  buyerName: string;
  buyerEmail: string;
  buyerCompany: string;
};

export const GUEST_BUYER_STORAGE_KEY = "usparts_guest_buyer";

export function loadGuestBuyer(): BuyerContact | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(GUEST_BUYER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<BuyerContact>;
    if (!parsed.buyerEmail || !parsed.buyerName) {
      return null;
    }

    return {
      buyerName: parsed.buyerName,
      buyerEmail: parsed.buyerEmail,
      buyerCompany: parsed.buyerCompany ?? "",
    };
  } catch {
    return null;
  }
}

export function saveGuestBuyer(contact: BuyerContact): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(GUEST_BUYER_STORAGE_KEY, JSON.stringify(contact));
}
