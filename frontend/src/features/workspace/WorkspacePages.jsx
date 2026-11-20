import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { get, post, put, remove, refresh } from "../../shared/services/api";
import { useResource } from "../../shared/hooks/useResource";
import { useSession } from "../../shared/store/session";
import {
  Icon,
  Button,
  Avatar,
  Badge,
  Field,
  Modal,
  Alert,
  Loading,
  ErrorState,
  Empty,
  Confirm,
  useToast,
  date,
} from "../../shared/components/ui";
import { ProjectCard, ProjectModal } from "../project/ProjectPages";
export function WorkspaceModal({ workspace, onClose }) {
  const [form, setForm] = useState({
      name: workspace?.name || "",
      description: workspace?.description || "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const toast = useToast(),
    navigate = useNavigate();
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const w = workspace
        ? await put(`/api/workspaces/${workspace.id}`, form)
        : await post("/api/workspaces", form);
      refresh();
      toast(workspace ? "Workspace updated." : "Your workspace is ready.");
      onClose();
      if (!workspace) navigate(`/workspaces/${w.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={workspace ? "Edit workspace" : "A space for your team"}
      subtitle="Give your people and projects a place to come together."
      onClose={() => !busy && onClose()}
    >
      <form onSubmit={save}>
        <div className="modal-body">
          {error && <Alert>{error}</Alert>}
          <Field label="Workspace name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Design studio"
              required
              maxLength={100}
            />
          </Field>
          <Field
            label="Description"
            hint="A few words about what you’re building together."
          >
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="What brings this team together?"
              rows={3}
              maxLength={2000}
            />
          </Field>
        </div>
        <footer className="modal-footer">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" busy={busy}>
            {workspace ? "Save changes" : "Create workspace"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
export default function WorkspacesPage() {
  const [params, setParams] = useSearchParams(),
    [creating, setCreating] = useState(params.has("new"));
  const toast = useToast();
  const [pending, setPending] = useState(null);
  const resource = useResource(async () => {
    const [workspaces, invitations] = await Promise.all([
      get("/api/workspaces"),
      get("/api/invitations"),
    ]);
    return { workspaces, invitations };
  });
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const { workspaces, invitations } = resource.data;
  async function respond(id, action) {
    setPending(id);
    try {
      await post(`/api/invitations/${id}/${action}`);
      refresh();
      toast(
        action === "accept" ? "Welcome to the team." : "Invitation declined.",
      );
    } catch (e) {
      toast(e.message, true);
    } finally {
      setPending(null);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">BETTER, TOGETHER</span>
          <h1>
            Your workspaces
            <span className="heading-count">{workspaces.length}</span>
          </h1>
          <p>Different teams. Shared momentum. Find your people here.</p>
        </div>
        <Button icon="plus" onClick={() => setCreating(true)}>
          New workspace
        </Button>
      </div>
      {invitations.length > 0 && (
        <section className="invitations-banner">
          <div className="section-heading">
            <h2>
              <Icon name="mail" size={20} />
              You’re invited
            </h2>
            <Badge tone="purple">{invitations.length} pending</Badge>
          </div>
          {invitations.map((i) => (
            <div className="invitation-row" key={i.id}>
              <div>
                <strong>{i.workspaceName}</strong>
                <p>
                  Join as a {i.role.toLowerCase()} and start making things
                  happen.
                </p>
              </div>
              <div>
                <Button
                  variant="secondary"
                  disabled={pending === i.id}
                  onClick={() => respond(i.id, "decline")}
                >
                  Decline
                </Button>
                <Button
                  busy={pending === i.id}
                  onClick={() => respond(i.id, "accept")}
                >
                  Join workspace
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}
      {workspaces.length === 0 ? (
        <div className="panel">
          <Empty
            icon="team"
            title="Great work starts with your people"
            description="Create a workspace to bring your team, projects, and ideas together."
          >
            <Button icon="plus" onClick={() => setCreating(true)}>
              Create your first workspace
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="workspace-grid">
          {workspaces.map((w, i) => (
            <Link
              className="panel workspace-card"
              to={`/workspaces/${w.id}`}
              key={w.id}
            >
              <div className="workspace-card-top">
                <span className={`workspace-card-icon tone-${i % 4}`}>
                  <Icon name="team" size={25} />
                </span>
                <Badge tone={w.role === "OWNER" ? "purple" : ""}>
                  {w.role.toLowerCase()}
                </Badge>
              </div>
              <h2>{w.name}</h2>
              <p>
                {w.description ||
                  "A shared space for your team’s next great thing."}
              </p>
              <footer>
                <span>
                  <Icon name="team" size={16} />
                  {w.membersCount} {w.membersCount === 1 ? "member" : "members"}
                </span>
                <Icon name="arrow" size={18} />
              </footer>
            </Link>
          ))}
        </div>
      )}
      {creating && (
        <WorkspaceModal
          onClose={() => {
            setCreating(false);
            params.delete("new");
            setParams(params, { replace: true });
          }}
        />
      )}
    </>
  );
}
function InviteModal({ workspace, onClose }) {
  const [email, setEmail] = useState(""),
    [role, setRole] = useState("MEMBER"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const toast = useToast();
  return (
    <Modal
      title="Good work needs good company"
      subtitle={`Invite someone to ${workspace.name}.`}
      onClose={() => !busy && onClose()}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await post(`/api/workspaces/${workspace.id}/members`, {
              email,
              role,
            });
            refresh();
            toast("Invitation created. They can accept it in Teamflow.");
            onClose();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body">
          {error && <Alert>{error}</Alert>}
          <Field label="Email address">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              required
              maxLength={254}
            />
          </Field>
          <Field label="Workspace role">
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="MEMBER">Member — collaborate on tasks</option>
              {workspace.role === "OWNER" && (
                <option value="ADMIN">
                  Admin — manage projects and members
                </option>
              )}
            </select>
          </Field>
          <div className="info-note">
            <Icon name="mail" size={18} />
            <p>
              The invitation appears in their Teamflow account. They can sign up
              or sign in with this email to accept it.
            </p>
          </div>
        </div>
        <footer className="modal-footer">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" busy={busy} icon="plus">
            Create invitation
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
export function WorkspaceDetailsPage() {
  const { id } = useParams(),
    navigate = useNavigate(),
    toast = useToast(),
    user = useSession((s) => s.user);
  const [tab, setTab] = useState("projects"),
    [modal, setModal] = useState(null),
    [confirm, setConfirm] = useState(null),
    [pending, setPending] = useState(null);
  const resource = useResource(async () => {
    const [workspace, projects, tasks] = await Promise.all([
      get(`/api/workspaces/${id}`),
      get(`/api/projects?workspaceId=${id}`),
      get("/api/tasks"),
    ]);
    return { workspace, projects, tasks };
  }, [id]);
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const { workspace: w, projects, tasks } = resource.data;
  const manager = ["OWNER", "ADMIN"].includes(w.role);
  async function changeRole(m, role) {
    setPending(m.userId);
    try {
      await put(`/api/workspaces/${id}/members/${m.userId}/role`, { role });
      refresh();
      toast("Role updated.");
    } catch (e) {
      toast(e.message, true);
    } finally {
      setPending(null);
    }
  }
  return (
    <>
      <Link className="back-link" to="/workspaces">
        <Icon name="chevron" size={14} />
        All workspaces
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR SHARED SPACE</span>
          <h1>{w.name}</h1>
          <p>
            {w.description || "A place for your people and their best work."}
          </p>
        </div>
        <div className="heading-actions">
          {manager && (
            <>
              <Button
                variant="secondary"
                icon="edit"
                onClick={() => setModal("edit")}
              >
                Edit
              </Button>
              <Button icon="plus" onClick={() => setModal("invite")}>
                Invite people
              </Button>
            </>
          )}
          {w.role === "OWNER" && (
            <button
              className="icon-btn danger-text"
              aria-label="Delete workspace"
              onClick={() => setConfirm({ type: "workspace" })}
            >
              <Icon name="trash" size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="workspace-summary panel">
        <div className="avatar-stack">
          {w.members.slice(0, 5).map((m) => (
            <Avatar user={m} key={m.userId} size={35} />
          ))}
        </div>
        <span>
          <strong>{w.membersCount}</strong>{" "}
          {w.membersCount === 1 ? "member" : "members"}
        </span>
        <span className="summary-separator" />
        <span>
          <strong>{projects.length}</strong> projects
        </span>
        <span className="summary-separator" />
        <span>Created {date(w.createdAt)}</span>
        <Badge tone="purple">{w.role.toLowerCase()}</Badge>
      </div>
      <div className="tabs">
        <button
          className={tab === "projects" ? "active" : ""}
          onClick={() => setTab("projects")}
        >
          <Icon name="folder" size={17} />
          Projects <span>{projects.length}</span>
        </button>
        <button
          className={tab === "members" ? "active" : ""}
          onClick={() => setTab("members")}
        >
          <Icon name="team" size={17} />
          People <span>{w.membersCount}</span>
        </button>
      </div>
      {tab === "projects" ? (
        <>
          <div className="section-heading">
            <h2>Room for your next big idea</h2>
            {manager && (
              <Button
                variant="secondary"
                icon="plus"
                onClick={() => setModal("project")}
              >
                New project
              </Button>
            )}
          </div>
          {projects.length ? (
            <div className="project-grid">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  tasks={tasks.filter((t) => t.projectId === p.id)}
                  workspace={w}
                />
              ))}
            </div>
          ) : (
            <div className="panel">
              <Empty
                title="Every big idea starts somewhere"
                description={
                  manager
                    ? "Create a project and give your team a clear direction."
                    : "Your team’s projects will appear here."
                }
              >
                {manager && (
                  <Button icon="plus" onClick={() => setModal("project")}>
                    Create a project
                  </Button>
                )}
              </Empty>
            </div>
          )}
        </>
      ) : (
        <div className="panel members-panel">
          <div className="section-heading">
            <h2>The people behind the progress</h2>
            <span className="muted">{w.membersCount} members</span>
          </div>
          {w.members.map((m) => (
            <div className="member-row" key={m.userId}>
              <Avatar user={m} size={40} />
              <div className="member-info">
                <strong>
                  {m.name}
                  {m.userId === user.id && <small> (you)</small>}
                </strong>
                <span>{m.email}</span>
              </div>
              {w.role === "OWNER" && m.role !== "OWNER" ? (
                <select
                  aria-label={`Role for ${m.name}`}
                  value={m.role}
                  disabled={pending === m.userId}
                  onChange={(e) => changeRole(m, e.target.value)}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              ) : (
                <Badge tone={m.role === "OWNER" ? "purple" : ""}>
                  {m.role.toLowerCase()}
                </Badge>
              )}
              {manager &&
                m.role !== "OWNER" &&
                (w.role === "OWNER" || m.role !== "ADMIN") && (
                  <button
                    className="icon-btn danger-text"
                    aria-label={`Remove ${m.name}`}
                    onClick={() => setConfirm({ type: "member", member: m })}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                )}
            </div>
          ))}
          {w.invitations.length > 0 && (
            <>
              <h3 className="pending-heading">Pending invitations</h3>
              {w.invitations.map((i) => (
                <div className="member-row" key={`invite-${i.id}`}>
                  <span className="pending-avatar">
                    <Icon name="mail" size={18} />
                  </span>
                  <div className="member-info">
                    <strong>{i.email}</strong>
                    <span>Waiting for them to join</span>
                  </div>
                  <Badge>Pending</Badge>
                  <button
                    className="icon-btn"
                    aria-label={`Cancel invitation for ${i.email}`}
                    onClick={async () => {
                      try {
                        await remove(
                          `/api/workspaces/${id}/invitations/${i.id}`,
                        );
                        refresh();
                        toast("Invitation canceled.");
                      } catch (e) {
                        toast(e.message, true);
                      }
                    }}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      {modal === "edit" && (
        <WorkspaceModal workspace={w} onClose={() => setModal(null)} />
      )}{" "}
      {modal === "invite" && (
        <InviteModal workspace={w} onClose={() => setModal(null)} />
      )}{" "}
      {modal === "project" && (
        <ProjectModal workspaceId={w.id} onClose={() => setModal(null)} />
      )}{" "}
      {confirm && (
        <Confirm
          title={
            confirm.type === "workspace"
              ? "Delete this workspace?"
              : `Remove ${confirm.member.name}?`
          }
          message={
            confirm.type === "workspace"
              ? "The workspace must have no projects. Its memberships and invitations will be deleted."
              : "They will lose access to this workspace and its projects."
          }
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            await remove(
              confirm.type === "workspace"
                ? `/api/workspaces/${id}`
                : `/api/workspaces/${id}/members/${confirm.member.userId}`,
            );
            refresh();
            toast(
              confirm.type === "workspace"
                ? "Workspace deleted."
                : "Member removed.",
            );
            if (confirm.type === "workspace") navigate("/workspaces");
          }}
        />
      )}
    </>
  );
}
