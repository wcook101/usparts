"use client";

import { useState } from "react";

type ContactDefaults = {
  name?: string;
  email?: string;
  company?: string;
};

type SupportContactFormProps = {
  contactDefaults?: ContactDefaults | null;
};

export function SupportContactForm({
  contactDefaults = null,
}: SupportContactFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      company: formData.get("company"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send your message");
      }

      setSubmittedEmail(String(payload.email));
      event.currentTarget.reset();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to send your message",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedEmail) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-900">
        <p className="font-medium">Message sent</p>
        <p className="mt-2 leading-6 text-green-800">
          Thanks for reaching out. We received your message and will reply to{" "}
          <span className="font-medium">{submittedEmail}</span> as soon as we can.
        </p>
        <button
          type="button"
          onClick={() => setSubmittedEmail(null)}
          className="mt-3 text-sm font-medium text-green-700 hover:text-green-800"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Your name</span>
          <input
            name="name"
            type="text"
            required
            defaultValue={contactDefaults?.name ?? ""}
            autoComplete="name"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={contactDefaults?.email ?? ""}
            autoComplete="email"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Company <span className="font-normal text-slate-500">(optional)</span>
        </span>
        <input
          name="company"
          type="text"
          defaultValue={contactDefaults?.company ?? ""}
          autoComplete="organization"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          How can we help?
        </span>
        <textarea
          name="message"
          required
          minLength={10}
          rows={5}
          placeholder="Describe your question or issue..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
