"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PartCategory, PartCondition } from "@/generated/prisma/client";
import { CATEGORY_LABELS, formatInventoryLocation } from "@/lib/format";

type InventoryLocationOption = {
  id: string;
  label: string | null;
  city: string;
  state: string | null;
  country: string;
};

type CompanyOption = {
  id: string;
  name: string;
  inventoryLocations: InventoryLocationOption[];
};

type ListingValues = {
  id: string;
  inventoryLocationId: string | null;
  mpn: string;
  manufacturer: string;
  description: string | null;
  category: PartCategory;
  quantity: number;
  price: string;
  currency: string;
  condition: PartCondition;
  dateCode: string | null;
  leadTimeDays: number | null;
  datasheetUrl: string | null;
};

type ListingFormProps = {
  companies: CompanyOption[];
  listing?: ListingValues;
};

const categories = Object.entries(CATEGORY_LABELS);

export function ListingForm({ companies, listing }: ListingFormProps) {
  const router = useRouter();
  const isEdit = Boolean(listing);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  useEffect(() => {
    if (companies.length === 1) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies]);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId),
    [companies, selectedCompanyId],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(
      [...formData.entries()].filter(([key]) => key !== "companyId"),
    );

    try {
      const response = await fetch(
        isEdit ? `/api/listings/${listing!.id}` : "/api/listings",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? `Failed to ${isEdit ? "update" : "create"} listing`,
        );
      }

      router.push(isEdit ? "/company/listings" : `/listings/${data.id}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : `Failed to ${isEdit ? "update" : "create"} listing`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {selectedCompany ? (
          <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Listing for <strong>{selectedCompany.name}</strong>
          </div>
        ) : null}

        <label className="block space-y-2 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Inventory location
          </span>
          <select
            name="inventoryLocationId"
            required
            defaultValue={listing?.inventoryLocationId ?? ""}
            disabled={!selectedCompany?.inventoryLocations.length}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
          >
            <option value="">
              {selectedCompany
                ? "Select where this part is stored"
                : "Select a company first"}
            </option>
            {selectedCompany?.inventoryLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {formatInventoryLocation(location)}
              </option>
            ))}
          </select>
          {selectedCompany && selectedCompany.inventoryLocations.length === 0 ? (
            <span className="text-xs text-amber-700">
              This company has no inventory locations yet. Add them during
              registration.
            </span>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">MPN</span>
          <input
            name="mpn"
            required
            defaultValue={listing?.mpn}
            placeholder="e.g. STM32F407VGT6"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Manufacturer</span>
          <input
            name="manufacturer"
            required
            defaultValue={listing?.manufacturer}
            placeholder="e.g. STMicroelectronics"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block space-y-2 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Description <span className="font-normal text-slate-500">(optional)</span>
          </span>
          <textarea
            name="description"
            rows={4}
            defaultValue={listing?.description ?? ""}
            placeholder="Add package type, specs, or notes if you want buyers to see them."
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <select
            name="category"
            required
            defaultValue={listing?.category ?? "OTHER"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {categories.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Condition</span>
          <select
            name="condition"
            defaultValue={listing?.condition ?? "NEW"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="NEW">New</option>
            <option value="REFURBISHED">Refurbished</option>
            <option value="USED">Used</option>
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Quantity</span>
          <input
            name="quantity"
            type="number"
            min="0"
            required
            defaultValue={listing?.quantity ?? 0}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Unit Price (USD)</span>
          <input
            name="price"
            type="number"
            min="0"
            step="0.0001"
            defaultValue={listing?.price ?? ""}
            placeholder="Optional — leave blank for quote"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Date Code</span>
          <input
            name="dateCode"
            type="text"
            defaultValue={listing?.dateCode ?? ""}
            placeholder="e.g. 2234"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Lead Time (days)</span>
          <input
            name="leadTimeDays"
            type="number"
            min="0"
            defaultValue={listing?.leadTimeDays ?? ""}
            placeholder="Optional"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block space-y-2 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Datasheet URL</span>
          <input
            name="datasheetUrl"
            type="text"
            inputMode="url"
            defaultValue={listing?.datasheetUrl ?? ""}
            placeholder="manufacturer.com/datasheet.pdf"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={
          isSubmitting ||
          companies.length === 0 ||
          !selectedCompany?.inventoryLocations.length
        }
        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting
          ? isEdit
            ? "Saving..."
            : "Publishing..."
          : isEdit
            ? "Save changes"
            : "Publish Listing"}
      </button>
    </form>
  );
}
