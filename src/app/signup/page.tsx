import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { SignedInNotice } from "@/components/SignedInNotice";
import { GUEST_SEARCH_LIMIT } from "@/lib/guest-search-limit";

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: "Create Account",
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const reason = typeof params.reason === "string" ? params.reason : undefined;
  const searchLimitReached = reason === "search-limit";

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {searchLimitReached ? "Continue searching parts" : "Create a free account"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {searchLimitReached ? (
            <>
              You&apos;ve used your {GUEST_SEARCH_LIMIT} free guest searches. Create a
              free account to search without limits, run multi-part lookups, and
              request quotes.
            </>
          ) : (
            <>
              Register to search without limits, request quotes, list inventory, and
              manage your company profile.
            </>
          )}
        </p>
        <SignedInNotice />
        <div className="mt-6">
          <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login?reason=search-limit&next=/search"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
