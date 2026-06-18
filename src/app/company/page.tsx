import Link from "next/link";
import { redirect } from "next/navigation";
import { CompanyCard } from "@/components/CompanyCard";
import { CompanyRegistrationForm } from "@/components/CompanyRegistrationForm";
import { getSessionUser } from "@/lib/auth";
import { getCompanies } from "@/lib/listings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "For Suppliers",
};

export default async function CompanyPage() {
  const [user, companies] = await Promise.all([getSessionUser(), getCompanies()]);

  if (user?.company || user?.membership) {
    redirect("/company/dashboard");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Supplier portal
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Put your excess and available stock in front of buyers.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Create a supplier account, register your company, publish part numbers
            with quantity and pricing, and let procurement teams discover your
            inventory when they search for hard-to-find components.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "List manufacturer part numbers and stock levels",
              "Email your spreadsheet to upload@usparts.us for hands-free import",
              "Upload inventory online via CSV or Excel",
              "Show lead times, condition, and warehouse location",
              "Get orders and quote requests directly from buyers",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-200/80 bg-white/90 p-5 text-sm leading-6 text-slate-700 shadow-sm backdrop-blur-sm"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link
              href="/company/upload"
              className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              Email inventory to upload@usparts.us
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          {user ? (
            <>
              <h2 className="text-xl font-semibold text-slate-900">
                Register your company
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Signed in as {user.email}. Complete your supplier profile to start
                listing inventory. If a company already exists under this email, it
                will be linked to your account automatically.
              </p>
              <div className="mt-6">
                <CompanyRegistrationForm />
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-900">
                Get started as a supplier
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Create an account, then register your company. Your account email
                becomes the owner of that company and its inventory.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/signup?next=/company"
                  className="inline-flex justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Create supplier account
                </Link>
                <Link
                  href="/login?next=/company"
                  className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign in
                </Link>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="mt-14">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">
            Active suppliers
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Companies currently listing components on USParts.
          </p>
        </div>

        {companies.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/90 p-10 text-center text-sm text-slate-600">
            No suppliers registered yet.
          </div>
        )}
      </section>
    </div>
  );
}
