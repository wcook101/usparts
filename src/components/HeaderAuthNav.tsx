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
  isPlatformAdmin: boolean;
};

type HeaderAuthNavProps = {
  layout?: "inline" | "stacked";
  onNavigate?: () => void;
};

const inlineLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";
const stackedLinkClass =
  "block rounded-lg px-4 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-100";
const stackedButtonClass =
  "block w-full rounded-lg px-4 py-3 text-center text-base font-medium transition";

export function HeaderAuthNav({
  layout = "inline",
  onNavigate,
}: HeaderAuthNavProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const stacked = layout === "stacked";

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
      <div
        className={`animate-pulse rounded-lg bg-slate-100 ${stacked ? "h-24 w-full" : "h-9 w-24"}`}
        aria-hidden
      />
    );
  }

  const linkProps = stacked ? { onClick: onNavigate } : {};

  if (!user) {
    if (stacked) {
      return (
        <div className="flex flex-col gap-2">
          <Link
            href="/login"
            onClick={onNavigate}
            className={`${stackedButtonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            onClick={onNavigate}
            className={`${stackedButtonClass} bg-blue-600 text-white hover:bg-blue-700`}
          >
            Sign up
          </Link>
        </div>
      );
    }

    return (
      <>
        <Link href="/login" className={inlineLinkClass}>
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
  const linkClass = stacked ? stackedLinkClass : inlineLinkClass;
  const actionLinkClass = stacked
    ? `${stackedButtonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`
    : "hidden rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 md:inline-flex";

  const links = (
    <>
      {user.isPlatformAdmin ? (
        <Link href="/admin" className={linkClass} {...linkProps}>
          Admin
        </Link>
      ) : null}
      <Link
        href="/account"
        className={
          stacked ? linkClass : `${inlineLinkClass} hidden sm:inline`
        }
        {...linkProps}
      >
        Account
      </Link>
      {hasCompany ? (
        <>
          <Link
            href="/company/dashboard"
            className={
              stacked ? linkClass : `${inlineLinkClass} hidden sm:inline`
            }
            {...linkProps}
          >
            Dashboard
          </Link>
          <Link
            href="/orders"
            className={
              stacked ? linkClass : `${inlineLinkClass} hidden md:inline`
            }
            {...linkProps}
          >
            My activity
          </Link>
          {user.canManageInventory ? (
            <>
              <Link
                href="/company/inbox"
                className={
                  stacked ? linkClass : `${inlineLinkClass} hidden lg:inline`
                }
                {...linkProps}
              >
                Inbox
              </Link>
              <Link
                href="/company/listings"
                className={
                  stacked ? linkClass : `${inlineLinkClass} hidden lg:inline`
                }
                {...linkProps}
              >
                Listings
              </Link>
              <Link
                href="/company/import"
                className={actionLinkClass}
                {...linkProps}
              >
                Bulk Import
              </Link>
              <Link
                href="/company/listings/new"
                className={
                  stacked
                    ? `${stackedButtonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`
                    : `${inlineLinkClass} hidden lg:inline-flex rounded-lg border border-slate-300 px-3 py-2`
                }
                {...linkProps}
              >
                List Part
              </Link>
              <Link
                href="/company/settings"
                className={
                  stacked ? linkClass : `${inlineLinkClass} hidden xl:inline`
                }
                {...linkProps}
              >
                Settings
              </Link>
            </>
          ) : null}
          {user.canInviteMembers ? (
            <Link
              href="/company/team"
              className={
                stacked ? linkClass : `${inlineLinkClass} hidden lg:inline`
              }
              {...linkProps}
            >
              Team
            </Link>
          ) : null}
        </>
      ) : (
        <Link
          href="/orders"
          className={
            stacked ? linkClass : `${inlineLinkClass} hidden md:inline`
          }
          {...linkProps}
        >
          My activity
        </Link>
      )}
    </>
  );

  if (stacked) {
    return (
      <div className="flex flex-col gap-1">
        {links}
        <p className="px-4 py-2 text-sm text-slate-500" title={user.email}>
          {user.company?.name ?? user.email}
        </p>
        <LogoutButton
          className={`${stackedButtonClass} bg-slate-800 text-white hover:bg-slate-900`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {links}
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
