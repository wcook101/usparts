"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type InviteDetails = {
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  company: {
    id: string;
    name: string;
    emailDomain: string;
  };
};

const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Supplier admin",
  MEMBER: "Buyer",
};

export function InviteAcceptCard({ token }: { token: string }) {
  const router = useRouter();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    async function loadInvite() {
      try {
        const response = await fetch(`/api/company/invites/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Invite not found");
        }

        setInvite(data.invite as InviteDetails);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Invite not found",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadInvite();
  }, [token]);

  async function handleAccept() {
    setIsAccepting(true);
    setError(null);

    try {
      const response = await fetch(`/api/company/invites/${token}/accept`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to accept invite");
      }

      router.push("/company/dashboard");
      router.refresh();
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Failed to accept invite",
      );
    } finally {
      setIsAccepting(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading invite...</p>;
  }

  if (!invite) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error ?? "Invite not found"}
      </div>
    );
  }

  const isPending = invite.status === "PENDING";
  const signupHref = `/signup?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(invite.email)}`;
  const loginHref = `/login?invite=${encodeURIComponent(token)}&next=${encodeURIComponent(`/invite/${token}`)}`;

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
        <p>
          You are invited to join{" "}
          <strong className="text-slate-900">{invite.company.name}</strong> as a{" "}
          <strong className="text-slate-900">
            {roleLabels[invite.role] ?? invite.role}
          </strong>
          .
        </p>
        <p className="mt-2">
          Use <strong>{invite.email}</strong> (@{invite.company.emailDomain}).
        </p>
        {!isPending ? (
          <p className="mt-2 text-amber-800">
            This invite is {invite.status.toLowerCase()}.
          </p>
        ) : null}
      </div>

      {isPending ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void handleAccept()}
            disabled={isAccepting}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
          >
            {isAccepting ? "Joining team..." : "Accept invite"}
          </button>
          <p className="text-center text-sm text-slate-600">
            Need an account first?{" "}
            <Link href={signupHref} className="font-medium text-blue-600">
              Create one
            </Link>{" "}
            or{" "}
            <Link href={loginHref} className="font-medium text-blue-600">
              sign in
            </Link>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}
