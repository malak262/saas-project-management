import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { get, put, refresh } from "../../shared/services/api";
import { useResource } from "../../shared/hooks/useResource";
import { useSession } from "../../shared/store/session";
import {
  Icon,
  Button,
  Badge,
  Avatar,
  Empty,
  Loading,
  ErrorState,
  useToast,
  date,
  statuses,
} from "../../shared/components/ui";
import TaskModal from "./TaskModal";
export function TaskBoard({
  tasks,
  projects = [],
  members = [],
  onTask,
  onCreate,
  view = "board",
}) {
  const toast = useToast(),
    [over, setOver] = useState(null),
    [moving, setMoving] = useState(null);
  async function move(task, status) {
    if (task.status === status) return;
    setMoving(task.id);
    try {
      await put(`/api/tasks/${task.id}`, { status, version: task.version });
      refresh();
      toast(`Moved to ${statuses[status].toLowerCase()}.`);
    } catch (e) {
      toast(e.message, true);
      refresh();
    } finally {
      setMoving(null);
      setOver(null);
    }
  }
  const projectName = (id) => projects.find((p) => p.id === id)?.name;
  const assignee = (id) => members.find((m) => m.userId === id);
  function card(t) {
    const overdue =
      t.dueDate &&
      t.dueDate < new Date().toLocaleDateString("en-CA") &&
      t.status !== "DONE";
    return (
      <button
        key={t.id}
        className={`task-card ${moving === t.id ? "is-moving" : ""}`}
        onClick={() => onTask(t.id)}
        draggable={moving !== t.id}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", String(t.id));
          e.dataTransfer.effectAllowed = "move";
        }}
      >
        <div className="task-card-top">
          <span className={`priority priority-${t.priority.toLowerCase()}`}>
            <Icon name="flag" size={12} />
            {t.priority.toLowerCase()}
          </span>
          <span className="task-id">TF-{t.id}</span>
        </div>
        {t.labels.length > 0 && (
          <div className="task-labels">
            {t.labels.slice(0, 3).map((l, i) => (
              <Badge key={l} tone={["purple", "blue", "pink"][i % 3]}>
                {l}
              </Badge>
            ))}
          </div>
        )}
        <h3>{t.title}</h3>
        {t.description && <p>{t.description}</p>}
        {projectName(t.projectId) && (
          <span className="task-project">
            <Icon name="folder" size={12} />
            {projectName(t.projectId)}
          </span>
        )}
        <footer>
          <span className={overdue ? "overdue" : ""}>
            <Icon name="calendar" size={13} />
            {t.dueDate ? date(t.dueDate) : "No date"}
          </span>
          <span className="task-card-end">
            {t.commentsCount > 0 && (
              <span>
                <Icon name="comment" size={13} />
                {t.commentsCount}
              </span>
            )}
            {t.assignedUser ? (
              <Avatar
                user={
                  assignee(t.assignedUser) || {
                    name: `Member ${t.assignedUser}`,
                  }
                }
                size={25}
              />
            ) : (
              <span className="unassigned-avatar" title="Unassigned">
                <Icon name="team" size={14} />
              </span>
            )}
          </span>
        </footer>
      </button>
    );
  }
  if (view === "list")
    return (
      <div className="panel task-list">
        <div className="task-list-head">
          <span>Task name</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Due date</span>
        </div>
        {tasks.length === 0 ? (
          <Empty
            icon="tasks"
            title="A clear slate"
            description="Create a task, or adjust your filters to see more."
          />
        ) : (
          tasks.map((t) => (
            <button
              className="task-list-row"
              key={t.id}
              onClick={() => onTask(t.id)}
            >
              <span>
                <span className={`status-ring ${t.status.toLowerCase()}`}>
                  <Icon
                    name={t.status === "DONE" ? "check" : "circle"}
                    size={15}
                  />
                </span>
                <strong>{t.title}</strong>
                <small>{projectName(t.projectId)}</small>
              </span>
              <Badge tone={t.status.toLowerCase()}>{statuses[t.status]}</Badge>
              <span className={`priority priority-${t.priority.toLowerCase()}`}>
                {t.priority.toLowerCase()}
              </span>
              <span>{date(t.dueDate)}</span>
            </button>
          ))
        )}
      </div>
    );
  return (
    <div className="kanban">
      {Object.entries(statuses).map(([status, label]) => {
        const list = tasks.filter((t) => t.status === status);
        return (
          <section
            className={`kanban-column ${over === status ? "drag-over" : ""}`}
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOver(status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setOver(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const t = tasks.find(
                (t) => t.id === Number(e.dataTransfer.getData("text/plain")),
              );
              if (t) move(t, status);
            }}
          >
            <header>
              <span>
                <i className={`status-dot ${status.toLowerCase()}`} />
                {label}
                <b>{list.length}</b>
              </span>
              <button
                className="icon-btn"
                aria-label={`Add a task to ${label}`}
                onClick={() => onCreate(status)}
              >
                <Icon name="plus" size={17} />
              </button>
            </header>
            <div className="kanban-cards">
              {list.map(card)}
              {list.length === 0 && (
                <div className="column-empty">
                  <Icon
                    name={status === "DONE" ? "check" : "tasks"}
                    size={23}
                  />
                  <p>
                    {status === "DONE"
                      ? "Good things are on their way."
                      : "A little room for your next idea."}
                  </p>
                </div>
              )}
              <button className="add-task" onClick={() => onCreate(status)}>
                <Icon name="plus" size={16} />
                Add task
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
export default function TasksPage() {
  const [params, setParams] = useSearchParams();
  const user = useSession((s) => s.user);
  const [view, setView] = useState("board"),
    [creating, setCreating] = useState(false),
    [projectFilter, setProjectFilter] = useState(""),
    [priority, setPriority] = useState(""),
    [status, setStatus] = useState("");
  const mine = params.get("mine") === "1",
    q = params.get("q") || "",
    selected = params.get("task");
  const resource = useResource(
    async () => {
      const [tasks, projects, workspaces] = await Promise.all([
        get("/api/tasks"),
        get("/api/projects"),
        get("/api/workspaces"),
      ]);
      const details = await Promise.all(
        workspaces.map((w) => get(`/api/workspaces/${w.id}`)),
      );
      const members = [
        ...new Map(
          details.flatMap((w) => w.members).map((m) => [m.userId, m]),
        ).values(),
      ];
      return { tasks, projects, members };
    },
    [],
    15000,
  );
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const { tasks, projects, members } = resource.data;
  const filtered = tasks.filter(
    (t) =>
      (!mine || t.assignedUser === user.id) &&
      (!projectFilter || t.projectId === Number(projectFilter)) &&
      (!priority || t.priority === priority) &&
      (!status || t.status === status) &&
      (!q ||
        `${t.title} ${t.description} ${t.labels.join(" ")}`
          .toLowerCase()
          .includes(q.toLowerCase())),
  );
  function updateParam(key, value) {
    setParams((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
      return p;
    });
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ONE STEP AT A TIME</span>
          <h1>
            {mine ? "My tasks" : "All tasks"}
            <span className="heading-count">{filtered.length}</span>
          </h1>
          <p>A little focus today. A lot of progress tomorrow.</p>
        </div>
        <Button
          icon="plus"
          onClick={() => setCreating(true)}
          disabled={projects.length === 0}
        >
          New task
        </Button>
      </div>
      <div className="toolbar">
        <div className="search-input">
          <Icon name="search" size={17} />
          <input
            aria-label="Filter tasks"
            placeholder="Search tasks…"
            value={q}
            onChange={(e) => updateParam("q", e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by project"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="">All priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(statuses).map(([k, v]) => (
            <option value={k} key={k}>
              {v}
            </option>
          ))}
        </select>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={mine}
            onChange={(e) => updateParam("mine", e.target.checked ? "1" : "")}
          />
          Assigned to me
        </label>
        <div className="view-switch">
          <button
            className={view === "board" ? "selected" : ""}
            aria-label="Board view"
            aria-pressed={view === "board"}
            onClick={() => setView("board")}
          >
            <Icon name="board" size={17} />
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
      <TaskBoard
        tasks={filtered}
        projects={projects}
        members={members}
        view={view}
        onTask={(id) => updateParam("task", id)}
        onCreate={(status) => setCreating(status)}
      />
      {(creating || selected) && (
        <TaskModal
          taskId={selected ? Number(selected) : null}
          initialStatus={typeof creating === "string" ? creating : "TODO"}
          projectId={projectFilter ? Number(projectFilter) : null}
          onClose={() => {
            setCreating(false);
            updateParam("task", "");
          }}
        />
      )}
    </>
  );
}
