"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";

export function SignedInNotice() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          user: { email: string; company: { name: string } | null };
        };
        if (!cancelled) {
          setEmail(data.user.company?.name ?? data.user.email);
        }
      } catch {
        // ignore
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!email) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
      <p className="text-sm text-green-900">
        You are signed in as <strong>{email}</strong>.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link
          href="/company/dashboard"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to dashboard
        </Link>
        <LogoutButton className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900" />
      </div>
    </div>
  );
}
