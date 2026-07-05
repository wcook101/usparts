import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.forgotPassword;

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your account email and we will send a reset link.
        </p>
        <div className="mt-6">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
