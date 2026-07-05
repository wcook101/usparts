import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { SignedInNotice } from "@/components/SignedInNotice";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.login;

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
          Need an account?{" "}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
