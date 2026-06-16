"use client";

import { useEffect, useState } from "react";
import {
  loadGuestBuyer,
  saveGuestBuyer,
  type BuyerContact,
} from "@/lib/guest-buyer";

export type BuyerDefaults = BuyerContact;

type UseBuyerContactOptions = {
  buyerDefaults?: BuyerDefaults | null;
};

export function useBuyerContact({ buyerDefaults = null }: UseBuyerContactOptions) {
  const hasAccountProfile = Boolean(
    buyerDefaults?.buyerEmail && buyerDefaults.buyerName,
  );

  const [guestContact, setGuestContact] = useState<BuyerContact>({
    buyerName: "",
    buyerEmail: "",
    buyerCompany: "",
  });
  const [guestLoaded, setGuestLoaded] = useState(false);

  useEffect(() => {
    if (hasAccountProfile) {
      return;
    }

    const stored = loadGuestBuyer();
    if (stored) {
      setGuestContact(stored);
    }
    setGuestLoaded(true);
  }, [hasAccountProfile]);

  const contact = hasAccountProfile ? buyerDefaults! : guestContact;

  function updateGuestField(
    field: keyof BuyerContact,
    value: string,
  ): void {
    setGuestContact((current) => ({ ...current, [field]: value }));
  }

  function persistGuestContact(next: BuyerContact): void {
    if (!hasAccountProfile) {
      saveGuestBuyer(next);
    }
  }

  return {
    hasAccountProfile,
    contact,
    guestContact,
    guestLoaded,
    updateGuestField,
    persistGuestContact,
  };
}

type BuyerContactFieldsProps = {
  buyerDefaults?: BuyerDefaults | null;
  onContactReady?: (contact: BuyerContact) => void;
};

export function BuyerProfileBanner({ contact }: { contact: BuyerContact }) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
      <p className="font-medium">Using your account: {contact.buyerName}</p>
      <p className="mt-1 text-green-800">
        {contact.buyerEmail}
        {contact.buyerCompany ? ` · ${contact.buyerCompany}` : ""}
      </p>
    </div>
  );
}

export function BuyerContactFields({
  buyerDefaults = null,
  onContactReady,
}: BuyerContactFieldsProps) {
  const {
    hasAccountProfile,
    contact,
    guestContact,
    guestLoaded,
    updateGuestField,
  } = useBuyerContact({ buyerDefaults });

  useEffect(() => {
    if (hasAccountProfile) {
      onContactReady?.(contact);
    }
  }, [hasAccountProfile, contact, onContactReady]);

  useEffect(() => {
    if (!hasAccountProfile && guestLoaded) {
      onContactReady?.(guestContact);
    }
  }, [hasAccountProfile, guestLoaded, guestContact, onContactReady]);

  if (hasAccountProfile) {
    return <BuyerProfileBanner contact={contact} />;
  }

  if (!guestLoaded) {
    return (
      <div className="h-24 animate-pulse rounded-lg bg-slate-100" aria-hidden />
    );
  }

  return (
    <>
      <p className="text-xs text-slate-500 sm:col-span-2">
        Your details are saved on this device for next time.{" "}
        <a href="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Sign in
        </a>{" "}
        to sync across devices.
      </p>
      <label className="block space-y-2 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">Your name</span>
        <input
          name="buyerName"
          required
          value={guestContact.buyerName}
          onChange={(event) => updateGuestField("buyerName", event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="block space-y-2 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          name="buyerEmail"
          type="email"
          required
          value={guestContact.buyerEmail}
          onChange={(event) => updateGuestField("buyerEmail", event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="block space-y-2 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">
          Company <span className="font-normal text-slate-500">(optional)</span>
        </span>
        <input
          name="buyerCompany"
          value={guestContact.buyerCompany}
          onChange={(event) =>
            updateGuestField("buyerCompany", event.target.value)
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>
    </>
  );
}

export function resolveBuyerPayload(
  formData: FormData,
  contact: BuyerContact,
  hasAccountProfile: boolean,
): BuyerContact {
  if (hasAccountProfile) {
    return contact;
  }

  return {
    buyerName: String(formData.get("buyerName") ?? contact.buyerName).trim(),
    buyerEmail: String(formData.get("buyerEmail") ?? contact.buyerEmail).trim(),
    buyerCompany: String(
      formData.get("buyerCompany") ?? contact.buyerCompany,
    ).trim(),
  };
}
