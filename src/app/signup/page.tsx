import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { SignedInNotice } from "@/components/SignedInNotice";

export const metadata = {
  title: "Create Account",
};

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Create a supplier account
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Register to list inventory, run bulk imports, and manage your company
          profile.
        </p>
        <SignedInNotice />
        <div className="mt-6">
          <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Buyers can search for free.{" "}
          <Link href="/search" className="font-medium text-blue-600 hover:text-blue-700">
            Browse parts
          </Link>
        </p>
      </div>
    </div>
  );
}
