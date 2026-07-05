import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { getSessionUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata.account;

export default async function AccountPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const displayName =
    user.name?.trim() || user.email.split("@")[0] || user.email;

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account settings
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Update how your name appears on orders and quote requests.
        </p>
        <div className="mt-6">
          <ProfileForm initialName={displayName} email={user.email} />
        </div>
      </div>
    </div>
  );
}
