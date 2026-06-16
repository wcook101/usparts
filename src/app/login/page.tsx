import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { SignedInNotice } from "@/components/SignedInNotice";

export const metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to place orders, request quotes, and manage your company.
        </p>
        <SignedInNotice />
        <div className="mt-6">
          <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
            <AuthForm mode="login" />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Just browsing parts?{" "}
          <Link href="/search" className="font-medium text-blue-600 hover:text-blue-700">
            Search without an account
          </Link>
        </p>
      </div>
    </div>
  );
}
