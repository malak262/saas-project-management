import { useState } from "react";
import { Navigate } from "react-router-dom";
import { get, put, refresh } from "../../shared/services/api";
import { useResource } from "../../shared/hooks/useResource";
import { useSession } from "../../shared/store/session";
import {
  Avatar,
  Loading,
  ErrorState,
  useToast,
  Badge,
} from "../../shared/components/ui";
export default function AdminPage() {
  const user = useSession((s) => s.user),
    toast = useToast(),
    [busy, setBusy] = useState(null);
  const resource = useResource(() =>
    user.role === "ADMIN" ? get("/api/users") : Promise.resolve([]),
  );
  if (user.role !== "ADMIN") return <Navigate to="/" replace />;
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PLATFORM ADMINISTRATION</span>
          <h1>Your community</h1>
          <p>
            Manage account roles. Role changes apply when the member next signs
            in.
          </p>
        </div>
      </div>
      <section className="panel members-panel">
        {resource.data.map((m) => (
          <div className="member-row" key={m.id}>
            <Avatar user={m} size={40} />
            <div className="member-info">
              <strong>
                {m.name}
                {m.id === user.id ? " (you)" : ""}
              </strong>
              <span>{m.email}</span>
            </div>
            {m.id === user.id ? (
              <Badge tone="purple">Admin</Badge>
            ) : (
              <select
                aria-label={`Platform role for ${m.name}`}
                value={m.role}
                disabled={busy === m.id}
                onChange={async (e) => {
                  setBusy(m.id);
                  try {
                    await put(`/api/auth/users/${m.id}/role`, {
                      role: e.target.value,
                    });
                    refresh();
                    toast("Platform role updated.");
                  } catch (e) {
                    toast(e.message, true);
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
