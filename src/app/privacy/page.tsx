import Link from "next/link";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Legal
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-slate-500">Last updated: June 2026</p>

      <div className="prose prose-slate mt-8 max-w-none space-y-6 text-sm leading-7 text-slate-700">
        <p>
          This is a placeholder privacy policy for the USParts development
          environment. Replace this text with counsel-reviewed language before
          launching on the public internet.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Information we collect</h2>
          <p className="mt-2">
            When you create an account, place an order, or request a quote, we
            collect contact details you provide (name, email, company) and
            information about the parts you search for or purchase.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">How we use information</h2>
          <p className="mt-2">
            We use your information to operate the marketplace, connect buyers
            with suppliers, send order and quote notifications, and improve the
            service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Sharing</h2>
          <p className="mt-2">
            Order and quote details are shared with the relevant supplier so they
            can fulfill your request. We do not sell personal information to third
            parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <p className="mt-2">
            Questions about privacy? Email{" "}
            <a href={SUPPORT_MAILTO} className="font-medium text-blue-600 hover:text-blue-700">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>

      <Link
        href="/"
        className="mt-10 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Back to home
      </Link>
    </div>
  );
}
