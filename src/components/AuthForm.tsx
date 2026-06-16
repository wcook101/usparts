"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

function AuthFormFields({
  mode,
  nextPath,
  inviteToken,
  inviteEmail,
}: {
  mode: AuthMode;
  nextPath: string;
  inviteToken: string | null;
  inviteEmail: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === "signup";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      ...(inviteToken ? { inviteToken } : {}),
    };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Authentication failed");
      }

      router.push(nextPath);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Authentication failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
      {inviteToken ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          You are joining via a company invite. Use the invited work email address.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isSignup ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Your name</span>
          <input
            name="name"
            autoComplete="name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          required
          defaultValue={inviteEmail ?? undefined}
          readOnly={Boolean(inviteEmail)}
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 read-only:bg-slate-50"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={isSignup ? 8 : 1}
          autoComplete={isSignup ? "new-password" : "current-password"}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {isSignup ? (
          <span className="text-xs text-slate-500">At least 8 characters</span>
        ) : (
          <span className="text-xs text-slate-500">
            <Link href="/forgot-password" className="font-medium text-blue-600">
              Forgot password?
            </Link>
          </span>
        )}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting
          ? isSignup
            ? "Creating account..."
            : "Signing in..."
          : isSignup
            ? "Create account"
            : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-600">
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          href={
            isSignup
              ? `/login${buildAuthQuery(nextPath, inviteToken)}`
              : `/signup${buildAuthQuery(nextPath, inviteToken, inviteEmail)}`
          }
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}

function buildAuthQuery(
  nextPath: string,
  inviteToken: string | null,
  inviteEmail?: string | null,
) {
  const params = new URLSearchParams();
  if (nextPath && nextPath !== "/company") {
    params.set("next", nextPath);
  }
  if (inviteToken) {
    params.set("invite", inviteToken);
  }
  if (inviteEmail) {
    params.set("email", inviteEmail);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function AuthFormSkeleton({ isSignup }: { isSignup: boolean }) {
  return (
    <div className="space-y-5" aria-hidden>
      {isSignup ? (
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-slate-200" />
          <div className="h-10 w-full rounded-lg bg-slate-100" />
        </div>
      ) : null}
      <div className="space-y-2">
        <div className="h-4 w-12 rounded bg-slate-200" />
        <div className="h-10 w-full rounded-lg bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 rounded bg-slate-200" />
        <div className="h-10 w-full rounded-lg bg-slate-100" />
      </div>
      <div className="h-11 w-full rounded-lg bg-slate-200" />
    </div>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const inviteToken = searchParams.get("invite");
  const inviteEmail = searchParams.get("email");
  const nextPath = searchParams.get("next") || (inviteToken ? `/invite/${inviteToken}` : "/company");
  const isSignup = mode === "signup";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <AuthFormSkeleton isSignup={isSignup} />;
  }

  return (
    <AuthFormFields
      mode={mode}
      nextPath={nextPath}
      inviteToken={inviteToken}
      inviteEmail={inviteEmail}
    />
  );
}
