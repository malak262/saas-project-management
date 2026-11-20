import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { get, post, put, remove, refresh } from "../../shared/services/api";
import { useResource } from "../../shared/hooks/useResource";
import {
  Icon,
  Button,
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
import { TaskBoard } from "../task/TasksPage";
import TaskModal from "../task/TaskModal";
const colors = [
  "#6366f1",
  "#8b5cf6",
  "#e879a8",
  "#0ea5a4",
  "#e4a44a",
  "#4c8ce5",
];
export function ProjectModal({ project, workspaceId, onClose }) {
  const resource = useResource(() => get("/api/workspaces"));
  return (
    <Modal
      title={project ? "Edit project" : "Make space for your next big idea"}
      subtitle="A clear direction. A shared goal. A fresh start."
      onClose={onClose}
    >
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : (
        <ProjectForm
          project={project}
          workspaceId={workspaceId}
          workspaces={resource.data.filter((w) =>
            ["OWNER", "ADMIN"].includes(w.role),
          )}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
function ProjectForm({ project, workspaceId, workspaces, onClose }) {
  const [form, setForm] = useState({
      name: project?.name || "",
      description: project?.description || "",
      workspaceId:
        project?.workspaceId || workspaceId || workspaces[0]?.id || "",
      color: project?.color || colors[0],
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const navigate = useNavigate(),
    toast = useToast();
  if (!workspaces.length)
    return (
      <div className="modal-body">
        <p>
          Create a workspace, or ask your workspace owner for an admin role, to
          create projects.
        </p>
        <Button onClick={onClose}>Got it</Button>
      </div>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const payload = { ...form, workspaceId: Number(form.workspaceId) };
          const p = project
            ? await put(`/api/projects/${project.id}`, payload)
            : await post("/api/projects", payload);
          refresh();
          toast(project ? "Project updated." : "Your next chapter is ready.");
          onClose();
          if (!project) navigate(`/projects/${p.id}`);
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="modal-body">
        {error && <Alert>{error}</Alert>}
        <Field label="Project name">
          <input
            placeholder="e.g. A fresh brand experience"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            maxLength={120}
          />
        </Field>
        <Field label="Description">
          <textarea
            placeholder="What are we working toward?"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={5000}
          />
        </Field>
        <Field label="Workspace">
          <select
            value={form.workspaceId}
            disabled={!!project || !!workspaceId}
            onChange={(e) => setForm({ ...form, workspaceId: e.target.value })}
          >
            {workspaces.map((w) => (
              <option value={w.id} key={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Project color">
          <span className="color-options">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                style={{ background: c }}
                className={form.color === c ? "selected" : ""}
                aria-label={`Choose ${c} color`}
                aria-pressed={form.color === c}
                onClick={() => setForm({ ...form, color: c })}
              >
                {form.color === c && <Icon name="check" size={17} />}
              </button>
            ))}
          </span>
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
          {project ? "Save changes" : "Create project"}
        </Button>
      </footer>
    </form>
  );
}
export function ProjectCard({ project: p, tasks = [], workspace }) {
  const done = tasks.filter((t) => t.status === "DONE").length,
    progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return (
    <Link className="panel project-card" to={`/projects/${p.id}`}>
      <div className="project-card-top">
        <span
          className="project-icon"
          style={{ background: `${p.color}16`, color: p.color }}
        >
          <Icon name="folder" size={23} />
        </span>
        <Badge tone={progress === 100 && tasks.length ? "green" : "purple"}>
          {progress === 100 && tasks.length ? "Completed" : "In motion"}
        </Badge>
      </div>
      <span className="project-workspace">
        {workspace?.name || "Team project"}
      </span>
      <h2>{p.name}</h2>
      <p>{p.description || "Big ideas, small steps. Let’s make it happen."}</p>
      <div className="progress-caption">
        <span>Progress</span>
        <strong>{progress}%</strong>
      </div>
      <div className="progress-track">
        <i style={{ width: `${progress}%`, background: p.color }} />
      </div>
      <footer>
        <span>
          <Icon name="check" size={15} />
          {done}/{tasks.length} tasks
        </span>
        <span>
          <Icon name="calendar" size={14} />
          {date(p.createdAt)}
        </span>
      </footer>
    </Link>
  );
}
export default function ProjectsPage() {
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(params.has("new")),
    [q, setQ] = useState(""),
    [workspace, setWorkspace] = useState(""),
    [view, setView] = useState("grid");
  const resource = useResource(async () => {
    const [projects, workspaces, tasks] = await Promise.all([
      get("/api/projects"),
      get("/api/workspaces"),
      get("/api/tasks"),
    ]);
    return { projects, workspaces, tasks };
  });
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const { projects, workspaces, tasks } = resource.data,
    canCreate = workspaces.some((w) => ["OWNER", "ADMIN"].includes(w.role));
  const filtered = projects.filter(
    (p) =>
      (!workspace || p.workspaceId === Number(workspace)) &&
      `${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">IDEAS INTO ACTION</span>
          <h1>
            Your projects
            <span className="heading-count">{projects.length}</span>
          </h1>
          <p>The big picture, with every little step in the right place.</p>
        </div>
        <Button
          icon="plus"
          onClick={() => setCreating(true)}
          disabled={!canCreate}
        >
          New project
        </Button>
      </div>
      <div className="toolbar">
        <div className="search-input">
          <Icon name="search" size={17} />
          <input
            aria-label="Search projects"
            placeholder="Find a project…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by workspace"
          value={workspace}
          onChange={(e) => setWorkspace(e.target.value)}
        >
          <option value="">All workspaces</option>
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <span className="toolbar-count">{filtered.length} projects</span>
        <div className="view-switch">
          <button
            className={view === "grid" ? "selected" : ""}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            <Icon name="grid" size={17} />
          </button>
          <button
            className={view === "list" ? "selected" : ""}
            aria-label="List view"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <Icon name="list" size={17} />
          </button>
        </div>
      </div>
      {filtered.length ? (
        <div
          className={
            view === "grid" ? "project-grid" : "project-grid project-grid-list"
          }
        >
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              workspace={workspaces.find((w) => w.id === p.workspaceId)}
              tasks={tasks.filter((t) => t.projectId === p.id)}
            />
          ))}
        </div>
      ) : (
        <div className="panel">
          <Empty
            title={
              projects.length
                ? "No projects found"
                : "Your next big thing starts here"
            }
            description={
              projects.length
                ? "Try another search or workspace."
                : canCreate
                  ? "Create a project to give your ideas a clear path forward."
                  : "Create a workspace first, then bring your first project to life."
            }
          >
            {canCreate ? (
              <Button icon="plus" onClick={() => setCreating(true)}>
                Create a project
              </Button>
            ) : (
              <Link to="/workspaces" className="btn btn-primary">
                Go to workspaces
                <Icon name="arrow" size={17} />
              </Link>
            )}
          </Empty>
        </div>
      )}
      {creating && (
        <ProjectModal
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
export function ProjectDetailsPage() {
  const { id } = useParams(),
    navigate = useNavigate(),
    toast = useToast();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState("board"),
    [modal, setModal] = useState(null),
    [confirm, setConfirm] = useState(false),
    [q, setQ] = useState(""),
    [initialStatus, setInitialStatus] = useState("TODO");
  const resource = useResource(
    async () => {
      const project = await get(`/api/projects/${id}`);
      const [workspace, tasks] = await Promise.all([
        get(`/api/workspaces/${project.workspaceId}`),
        get(`/api/tasks?projectId=${id}`),
      ]);
      return { project, workspace, tasks };
    },
    [id],
    15000,
  );
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const { project: p, workspace: w, tasks } = resource.data,
    done = tasks.filter((t) => t.status === "DONE").length,
    manager = ["OWNER", "ADMIN"].includes(w.role);
  const filtered = tasks.filter((t) =>
    `${t.title} ${t.description} ${t.labels.join(" ")}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  function selectTask(task) {
    setParams(task ? { task } : {});
  }
  return (
    <>
      <Link className="back-link" to="/projects">
        <Icon name="chevron" size={14} />
        All projects
      </Link>
      <div className="page-heading project-detail-heading">
        <div className="project-heading-content">
          <span
            className="project-icon large"
            style={{ background: `${p.color}18`, color: p.color }}
          >
            <Icon name="folder" size={29} />
          </span>
          <div>
            <Link className="eyebrow" to={`/workspaces/${w.id}`}>
              {w.name}
            </Link>
            <h1>{p.name}</h1>
            <p>
              {p.description ||
                "Every little step brings the big picture closer."}
            </p>
          </div>
        </div>
        <div className="heading-actions">
          {manager && (
            <Button
              variant="secondary"
              icon="edit"
              onClick={() => setModal("edit")}
            >
              Edit project
            </Button>
          )}
          <Button icon="plus" onClick={() => setModal("task")}>
            New task
          </Button>
          {w.role === "OWNER" && (
            <button
              className="icon-btn danger-text"
              aria-label="Delete project"
              onClick={() => setConfirm(true)}
            >
              <Icon name="trash" size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="project-overview-strip">
        <span>
          <i className="status-dot in_progress" />
          {tasks.length} total tasks
        </span>
        <span>
          <Icon name="check" size={16} />
          {done} completed
        </span>
        <span>
          <Icon name="team" size={16} />
          {w.membersCount} team members
        </span>
        <div className="project-mini-progress">
          <div className="progress-track">
            <i
              style={{
                width: `${tasks.length ? (done / tasks.length) * 100 : 0}%`,
                background: p.color,
              }}
            />
          </div>
          <strong>
            {tasks.length ? Math.round((done / tasks.length) * 100) : 0}%
          </strong>
        </div>
      </div>
      <div className="toolbar">
        <div className="view-tabs">
          <button
            className={view === "board" ? "active" : ""}
            onClick={() => setView("board")}
          >
            <Icon name="board" size={17} />
            Board
          </button>
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            <Icon name="list" size={17} />
            List
          </button>
        </div>
        <div className="search-input">
          <Icon name="search" size={17} />
          <input
            aria-label="Search project tasks"
            placeholder="Search tasks…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <span className="toolbar-count">Drag tasks to move them forward</span>
      </div>
      <TaskBoard
        tasks={filtered}
        members={w.members}
        view={view}
        onTask={selectTask}
        onCreate={(status) => {
          setInitialStatus(status);
          setModal("task");
        }}
      />
      {modal === "edit" && (
        <ProjectModal project={p} onClose={() => setModal(null)} />
      )}{" "}
      {(modal === "task" || params.has("task")) && (
        <TaskModal
          initialStatus={initialStatus}
          projectId={p.id}
          taskId={params.has("task") ? Number(params.get("task")) : null}
          onClose={() => {
            setModal(null);
            selectTask(null);
          }}
        />
      )}
      {confirm && (
        <Confirm
          title="Delete this project?"
          message="This project and its tasks will no longer be accessible. This action cannot be undone from Teamflow."
          onClose={() => setConfirm(false)}
          onConfirm={async () => {
            await remove(`/api/projects/${id}`);
            refresh();
            toast("Project deleted.");
            navigate("/projects");
          }}
        />
      )}
    </>
  );
}
