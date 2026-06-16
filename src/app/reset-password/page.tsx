import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata = {
  title: "Set New Password",
};

type ResetPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter a new password for your USParts account.
        </p>
        <div className="mt-6">
          {token ? (
            <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>
              <ResetPasswordForm token={token} />
            </Suspense>
          ) : (
            <p className="text-sm text-red-700">
              This reset link is invalid. Request a new one from the forgot
              password page.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
