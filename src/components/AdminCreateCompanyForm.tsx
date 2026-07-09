"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type InventoryLocationInput = {
  label: string;
  city: string;
  state: string;
  country: string;
};

const emptyLocation = (): InventoryLocationInput => ({
  label: "",
  city: "",
  state: "",
  country: "US",
});

type AdminCreateCompanyFormProps = {
  defaultEmail?: string;
  defaultOwnerEmail?: string;
};

export function AdminCreateCompanyForm({
  defaultEmail = "",
  defaultOwnerEmail = "",
}: AdminCreateCompanyFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessEmail, setBusinessEmail] = useState(defaultEmail);
  const [ownerEmail, setOwnerEmail] = useState(defaultOwnerEmail || defaultEmail);
  const [inventoryLocations, setInventoryLocations] = useState([
    emptyLocation(),
  ]);

  function updateLocation(
    index: number,
    field: keyof InventoryLocationInput,
    value: string,
  ) {
    setInventoryLocations((current) =>
      current.map((location, locationIndex) =>
        locationIndex === index ? { ...location, [field]: value } : location,
      ),
    );
  }

  function addLocation() {
    setInventoryLocations((current) => [...current, emptyLocation()]);
  }

  function removeLocation(index: number) {
    setInventoryLocations((current) =>
      current.length === 1
        ? current
        : current.filter((_, locationIndex) => locationIndex !== index),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      ownerEmail: formData.get("ownerEmail") || undefined,
      description: formData.get("description"),
      website: formData.get("website"),
      phone: formData.get("phone"),
      inventoryLocations: inventoryLocations.map((location) => ({
        label: location.label,
        city: location.city,
        state: location.state,
        country: location.country.trim() || "US",
      })),
    };

    try {
      const response = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create company");
      }

      router.push("/admin/import");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create company",
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

      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Create a supplier company so you can import their inventory. If they
        already have a USParts account, assign them as owner below. If not, leave
        the company unowned — they can claim it later by signing up with the
        business email.
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Business email</span>
        <input
          name="email"
          type="email"
          required
          value={businessEmail}
          onChange={(event) => setBusinessEmail(event.target.value)}
          placeholder="sales@supplier.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <span className="text-xs text-slate-500">
          Contact email for RFQs and orders. Also used for auto-claim when they
          sign up with this address.
        </span>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Assign owner account (optional)
        </span>
        <input
          name="ownerEmail"
          type="email"
          value={ownerEmail}
          onChange={(event) => setOwnerEmail(event.target.value)}
          placeholder="Same as business email, or their login email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <span className="text-xs text-slate-500">
          If this email already has a USParts account, they become the company
          owner immediately. Leave blank (or matching business email with no
          account) to create an unowned company.
        </span>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Company name</span>
        <input
          name="name"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Description</span>
        <textarea
          name="description"
          rows={3}
          placeholder="Optional — what they specialize in"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Website</span>
          <input
            name="website"
            type="text"
            inputMode="url"
            placeholder="supplier.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Phone</span>
          <input
            name="phone"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Inventory storage location
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            At least one warehouse or storage site is required for imports.
          </p>
        </div>

        <div className="space-y-4">
          {inventoryLocations.map((location, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">
                  Location {index + 1}
                </p>
                {inventoryLocations.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeLocation(index)}
                    className="text-xs font-medium text-slate-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <label className="block space-y-2 sm:col-span-4">
                  <span className="text-sm font-medium text-slate-700">
                    Location name (optional)
                  </span>
                  <input
                    value={location.label}
                    onChange={(event) =>
                      updateLocation(index, "label", event.target.value)
                    }
                    placeholder="e.g. Main warehouse"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">City</span>
                  <input
                    value={location.city}
                    onChange={(event) =>
                      updateLocation(index, "city", event.target.value)
                    }
                    required
                    placeholder="Dallas"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">State</span>
                  <input
                    value={location.state}
                    onChange={(event) =>
                      updateLocation(index, "state", event.target.value)
                    }
                    placeholder="TX"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Country
                  </span>
                  <input
                    value={location.country}
                    onChange={(event) =>
                      updateLocation(index, "country", event.target.value)
                    }
                    required
                    placeholder="US"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addLocation}
          className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          + Add another location
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Creating..." : "Create company"}
        </button>
        <Link
          href="/admin"
          className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
