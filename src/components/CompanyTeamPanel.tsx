"use client";

import { useEffect, useState } from "react";

type TeamMember = {
  id: string;
  role: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
};

type TeamData = {
  currentUserId: string;
  company: {
    id: string;
    name: string;
    emailDomain: string;
  };
  members: TeamMember[];
  invites: PendingInvite[];
};

const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Supplier admin",
  MEMBER: "Buyer",
};

export function CompanyTeamPanel() {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  async function loadTeam() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/company/invites", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load team");
      }

      setTeam(data as TeamData);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load team",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTeam();
  }, []);

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInviteLink(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/company/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send invite");
      }

      const origin = window.location.origin;
      setInviteLink(`${origin}/invite/${data.invite.token}`);
      setInviteEmail("");
      await loadTeam();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to send invite",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function revokeInvite(inviteId: string) {
    setActionId(inviteId);
    setError(null);

    try {
      const response = await fetch("/api/company/invites/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to revoke invite");
      }

      await loadTeam();
    } catch (revokeError) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "Failed to revoke invite",
      );
    } finally {
      setActionId(null);
    }
  }

  async function removeMember(memberId: string) {
    if (!window.confirm("Remove this teammate from your company?")) {
      return;
    }

    setActionId(memberId);
    setError(null);

    try {
      const response = await fetch(`/api/company/members/${memberId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to remove member");
      }

      await loadTeam();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Failed to remove member",
      );
    } finally {
      setActionId(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading team...</p>;
  }

  if (!team) {
    return error ? (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    ) : null;
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-slate-900">Invite teammate</h2>
        <p className="mt-2 text-sm text-slate-600">
          Invites must use your company email domain{" "}
          <strong>@{team.company.emailDomain}</strong>.
        </p>

        <form onSubmit={handleInvite} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Work email</span>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder={`name@${team.company.emailDomain}`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Role</span>
              <select
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(event.target.value as "MEMBER" | "ADMIN")
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="MEMBER">Buyer (search & order)</option>
                <option value="ADMIN">Supplier admin (import & listings)</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
          >
            {isSubmitting ? "Sending invite..." : "Send invite"}
          </button>
        </form>

        {inviteLink ? (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            <p className="font-medium">Invite sent by email</p>
            <p className="mt-1 text-green-800">
              You can also share this link directly:
            </p>
            <p className="mt-2 break-all font-mono text-xs">{inviteLink}</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-slate-900">Team members</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {team.members.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {member.user.name ?? member.user.email}
                  {member.user.id === team.currentUserId ? " (you)" : ""}
                </p>
                <p className="text-slate-500">{member.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {roleLabels[member.role] ?? member.role}
                </span>
                {member.role !== "OWNER" &&
                member.user.id !== team.currentUserId ? (
                  <button
                    type="button"
                    onClick={() => void removeMember(member.id)}
                    disabled={actionId === member.id}
                    className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {actionId === member.id ? "Removing..." : "Remove"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {team.invites.length > 0 ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-slate-900">Pending invites</h2>
          <ul className="mt-4 space-y-3">
            {team.invites.map((invite) => (
              <li
                key={invite.id}
                className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{invite.email}</p>
                    <p className="mt-1 text-slate-500">
                      {roleLabels[invite.role] ?? invite.role} · expires{" "}
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                    <p className="mt-2 break-all font-mono text-xs text-blue-700">
                      {`${window.location.origin}/invite/${invite.token}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void revokeInvite(invite.id)}
                    disabled={actionId === invite.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {actionId === invite.id ? "Revoking..." : "Revoke"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
