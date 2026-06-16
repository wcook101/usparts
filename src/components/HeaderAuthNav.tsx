"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  company: { id: string; name: string } | null;
  role: string | null;
  canManageInventory: boolean;
  canInviteMembers: boolean;
};

export function HeaderAuthNav() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const data = (await response.json()) as { user: AuthUser };
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" aria-hidden />
    );
  }

  if (!user) {
    return (
      <>
        <Link
          href="/login"
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Sign up
        </Link>
      </>
    );
  }

  const hasCompany = Boolean(user.company);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/account"
        className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline"
      >
        Account
      </Link>
      {hasCompany ? (
        <>
          <Link
            href="/company/dashboard"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline"
          >
            Dashboard
          </Link>
          <Link
            href="/orders"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:inline"
          >
            My activity
          </Link>
          {user.canManageInventory ? (
            <>
              <Link
                href="/company/inbox"
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:inline"
              >
                Inbox
              </Link>
              <Link
                href="/company/listings"
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:inline"
              >
                Listings
              </Link>
              <Link
                href="/company/import"
                className="hidden rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 md:inline-flex"
              >
                Bulk Import
              </Link>
              <Link
                href="/company/listings/new"
                className="hidden rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 lg:inline-flex"
              >
                List Part
              </Link>
              <Link
                href="/company/settings"
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 xl:inline"
              >
                Settings
              </Link>
            </>
          ) : null}
          {user.canInviteMembers ? (
            <Link
              href="/company/team"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:inline"
            >
              Team
            </Link>
          ) : null}
        </>
      ) : (
        <Link
          href="/orders"
          className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 md:inline"
        >
          My activity
        </Link>
      )}
      <span
        className="max-w-[120px] truncate text-xs text-slate-500 sm:max-w-[160px] sm:text-sm"
        title={user.email}
      >
        {user.company?.name ?? user.email}
      </span>
      <LogoutButton className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900" />
    </div>
  );
}
