"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export function CompanyRegistrationForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [businessEmail, setBusinessEmail] = useState("");
  const [inventoryLocations, setInventoryLocations] = useState([
    emptyLocation(),
  ]);

  useEffect(() => {
    async function loadAccount() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { user: { email: string } };
        setAccountEmail(data.user.email);
        setBusinessEmail(data.user.email);
      } catch {
        // ignore
      }
    }

    void loadAccount();
  }, []);

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
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to register company");
      }

      router.push("/company/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to register company",
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
        Your login account
        {accountEmail ? (
          <>
            {" "}
            (<strong>{accountEmail}</strong>)
          </>
        ) : null}{" "}
        controls who can manage this company. Set a separate business email below
        if buyers should contact a different address.
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Business email</span>
        <input
          name="email"
          type="email"
          value={businessEmail}
          onChange={(event) => setBusinessEmail(event.target.value)}
          placeholder="sales@yourcompany.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <span className="text-xs text-slate-500">
          Used for RFQs, orders, and team invites. Defaults to your login email
          if you leave this as-is.
        </span>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Company Name</span>
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
          rows={4}
          placeholder="What components do you specialize in? (optional)"
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
            placeholder="aplusindustry.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <span className="text-xs text-slate-500">
            You can enter just the domain — https:// is added automatically.
          </span>
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
            Where do you store your inventory?
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Add each warehouse or storage site. You will choose from these when
            listing parts.
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
                    placeholder="e.g. Main warehouse, Dallas facility"
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
                  <span className="text-sm font-medium text-slate-700">Country</span>
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "Creating..." : "Register Company"}
      </button>
    </form>
  );
}
