import { Suspense } from "react";
import { InviteAcceptCard } from "@/components/InviteAcceptCard";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export const metadata = {
  title: "Accept Invite",
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Join your company team
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Accept the invite to search parts and place orders under your company
          profile.
        </p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>
            <InviteAcceptCard token={token} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
