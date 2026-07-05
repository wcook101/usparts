import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { SignedInNotice } from "@/components/SignedInNotice";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.signup;

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Create a free account
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Register to request quotes, list inventory, and manage your company
          profile.
        </p>
        <SignedInNotice />
        <div className="mt-6">
          <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
