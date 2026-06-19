import Link from "next/link";
import type { GuestSearchAccess } from "@/lib/guest-search-limit";

type GuestSearchLimitBannerProps = {
  access: GuestSearchAccess;
};

export function GuestSearchLimitBanner({ access }: GuestSearchLimitBannerProps) {
  if (!access.isGuest) {
    return null;
  }

  if (!access.allowed) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <p className="font-semibold text-amber-900">
          You&apos;ve used your {access.limit} free guest searches
        </p>
        <p className="mt-2 leading-6">
          Create a free account to keep searching parts, use multi-part lookup, and
          request quotes without limits.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/signup?reason=search-limit&next=/search"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create free account
          </Link>
          <Link
            href="/login?reason=search-limit&next=/search"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (access.remaining <= 1) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {access.remaining === 1 ? (
          <>
            <span className="font-medium text-slate-900">1 free search left</span>{" "}
            as a guest.{" "}
            <Link
              href="/signup?reason=search-limit&next=/search"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Create a free account
            </Link>{" "}
            for unlimited searching.
          </>
        ) : null}
      </div>
    );
  }

  return (
    <p className="text-sm text-slate-600">
      Guest search:{" "}
      <span className="font-medium text-slate-900">
        {access.remaining} of {access.limit} free searches remaining
      </span>
      .{" "}
      <Link
        href="/signup?reason=search-limit&next=/search"
        className="font-medium text-blue-600 hover:text-blue-700"
      >
        Sign up free
      </Link>{" "}
      for unlimited access.
    </p>
  );
}
