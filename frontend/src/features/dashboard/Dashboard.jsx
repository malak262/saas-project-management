import { useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../shared/services/api";
import { useSession } from "../../shared/store/session";
import { useResource } from "../../shared/hooks/useResource";
import {
  Icon,
  Button,
  Avatar,
  Badge,
  Loading,
  ErrorState,
  Empty,
  date,
  relative,
  statuses,
} from "../../shared/components/ui";
import TaskModal from "../task/TaskModal";
import { WorkspaceModal } from "../workspace/WorkspacePages";
export default function Dashboard() {
  const user = useSession((s) => s.user);
  const [task, setTask] = useState(null),
    [creating, setCreating] = useState(false),
    [workspaceModal, setWorkspaceModal] = useState(false);
  const resource = useResource(
    async () => {
      const [workspaces, projects, tasks] = await Promise.all([
        get("/api/workspaces"),
        get("/api/projects"),
        get("/api/tasks"),
      ]);
      return { workspaces, projects, tasks };
    },
    [],
    15000,
  );
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const { workspaces, projects, tasks } = resource.data;
  const today = new Date(),
    todayKey = today.toLocaleDateString("en-CA"),
    done = tasks.filter((t) => t.status === "DONE"),
    inProgress = tasks.filter((t) => t.status === "IN_PROGRESS");
  const mine = tasks
    .filter((t) => t.assignedUser === user.id && t.status !== "DONE")
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))
    .slice(0, 4);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const key = d.toLocaleDateString("en-CA");
    return {
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      created: tasks.filter(
        (t) => new Date(t.createdAt).toLocaleDateString("en-CA") === key,
      ).length,
      completed: done.filter(
        (t) => new Date(t.updatedAt).toLocaleDateString("en-CA") === key,
      ).length,
    };
  });
  const max = Math.max(3, ...days.flatMap((d) => [d.created, d.completed]));
  const activity = [
    ...tasks.map((t) => ({
      id: `task-${t.id}`,
      title: t.title,
      detail: `Task ${t.status === "DONE" ? "completed" : "updated"}`,
      at: t.updatedAt,
      taskId: t.id,
      icon: t.status === "DONE" ? "check" : "tasks",
    })),
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      title: p.name,
      detail: "Project created",
      at: p.createdAt,
      link: `/projects/${p.id}`,
      icon: "folder",
    })),
  ]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 4);
  const metrics = [
    {
      label: "Total projects",
      value: projects.length,
      icon: "folder",
      tone: "purple",
      detail: `Across ${workspaces.length} workspaces`,
    },
    {
      label: "In progress",
      value: inProgress.length,
      icon: "clock",
      tone: "blue",
      detail: "Moving things forward",
    },
    {
      label: "Completed tasks",
      value: done.length,
      icon: "check",
      tone: "green",
      detail: tasks.length
        ? `${Math.round((done.length / tasks.length) * 100)}% of all tasks`
        : "Ready for your first win",
    },
    {
      label: "Due today",
      value: tasks.filter((t) => t.dueDate === todayKey && t.status !== "DONE")
        .length,
      icon: "calendar",
      tone: "orange",
      detail: "A little focus goes a long way",
    },
  ];
  return (
    <>
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">YOUR WORK, AT A GLANCE</span>
          <h1>
            {today.getHours() < 12
              ? "Good morning"
              : today.getHours() < 18
                ? "Good afternoon"
                : "Good evening"}
            , {user.name.split(" ")[0]} <span className="greeting-wave">?</span>
          </h1>
          <p>Here’s what’s happening with your team today.</p>
        </div>
        <div className="heading-actions">
          <span className="today-date">
            <Icon name="calendar" size={16} />
            {today.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <Button
            icon="plus"
            onClick={() => setCreating(true)}
            disabled={projects.length === 0}
          >
            New task
          </Button>
        </div>
      </div>
      {workspaces.length === 0 && (
        <section className="welcome-banner">
          <div>
            <Badge tone="purple">YOUR NEXT CHAPTER</Badge>
            <h2>Good work starts with a great team.</h2>
            <p>
              Create your first workspace. Bring your people and ideas together.
            </p>
            <Button icon="plus" onClick={() => setWorkspaceModal(true)}>
              Create a workspace
            </Button>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <span />
            <span />
            <span />
            <Icon name="spark" size={52} />
          </div>
        </section>
      )}
      <div className="metrics-grid">
        {metrics.map((m) => (
          <div className="panel metric-card" key={m.label}>
            <div>
              <span>{m.label}</span>
              <span className={`metric-icon ${m.tone}`}>
                <Icon name={m.icon} size={20} />
              </span>
            </div>
            <strong>{m.value.toString().padStart(2, "0")}</strong>
            <small>{m.detail}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-middle">
        <section className="panel activity-chart">
          <div className="section-heading">
            <div>
              <h2>A week of momentum</h2>
              <p>Every small step adds up.</p>
            </div>
            <span className="period-pill">
              Last 7 days
              <Icon name="calendar" size={14} />
            </span>
          </div>
          <div className="chart-legend">
            <span>
              <i />
              Created
            </span>
            <span>
              <i />
              Completed
            </span>
          </div>
          <div className="chart">
            <div className="chart-grid">
              {[max, Math.round(max * 0.66), Math.round(max * 0.33), 0].map(
                (v, i) => (
                  <div key={i}>
                    <span>{v}</span>
                    <i />
                  </div>
                ),
              )}
            </div>
            <div className="chart-bars">
              {days.map((d, i) => (
                <div className="chart-day" key={i}>
                  <div>
                    <i
                      className="created-bar"
                      style={{ height: `${(d.created / max) * 100}%` }}
                      title={`${d.created} tasks created`}
                    />
                    <i
                      className="completed-bar"
                      style={{ height: `${(d.completed / max) * 100}%` }}
                      title={`${d.completed} tasks completed`}
                    />
                  </div>
                  <span>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel focus-panel">
          <div className="section-heading">
            <h2>
              Your focus today<span className="small-spark">?</span>
            </h2>
            <Link to="/tasks?mine=1" className="text-link">
              View all
              <Icon name="arrow" size={14} />
            </Link>
          </div>
          <p className="panel-subtitle">A few things to keep moving.</p>
          {mine.length ? (
            mine.map((t) => (
              <button
                className="focus-task"
                key={t.id}
                onClick={() => setTask(t.id)}
              >
                <span className={`status-ring ${t.status.toLowerCase()}`}>
                  <Icon name="circle" size={18} />
                </span>
                <span>
                  <strong>{t.title}</strong>
                  <small>
                    {projects.find((p) => p.id === t.projectId)?.name}
                    <i /> {date(t.dueDate)}
                  </small>
                </span>
                <span
                  className={`priority-dot ${t.priority.toLowerCase()}`}
                  title={`${t.priority} priority`}
                />
              </button>
            ))
          ) : (
            <Empty
              icon="sun"
              title="A little breathing room"
              description="No open tasks assigned to you. Your next step will show up here."
            />
          )}
          <div className="focus-footer">
            <Icon name="spark" size={16} />
            <span>One thing at a time. You’ve got this.</span>
          </div>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel projects-panel">
          <div className="section-heading">
            <div>
              <h2>Projects in motion</h2>
              <p>The bigger picture, coming together.</p>
            </div>
            <Link to="/projects" className="text-link">
              All projects
              <Icon name="arrow" size={14} />
            </Link>
          </div>
          {projects.length ? (
            <div className="dashboard-project-table">
              <div className="project-table-head">
                <span>Project name</span>
                <span>Progress</span>
                <span>Status</span>
              </div>
              {projects.slice(0, 4).map((p) => {
                const all = tasks.filter((t) => t.projectId === p.id),
                  finished = all.filter((t) => t.status === "DONE").length,
                  progress = all.length
                    ? Math.round((finished / all.length) * 100)
                    : 0;
                return (
                  <Link
                    className="project-table-row"
                    to={`/projects/${p.id}`}
                    key={p.id}
                  >
                    <span>
                      <i
                        className="project-icon"
                        style={{ background: `${p.color}18`, color: p.color }}
                      >
                        <Icon name="folder" size={18} />
                      </i>
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          {workspaces.find((w) => w.id === p.workspaceId)?.name}
                        </small>
                      </span>
                    </span>
                    <span>
                      <span className="progress-track">
                        <i
                          style={{ width: `${progress}%`, background: p.color }}
                        />
                      </span>
                      <b>{progress}%</b>
                    </span>
                    <Badge
                      tone={progress === 100 && all.length ? "green" : "purple"}
                    >
                      {progress === 100 && all.length
                        ? "Completed"
                        : "In progress"}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Empty
              title="Room for something great"
              description="Your team’s projects will appear here."
            >
              <Link to="/projects" className="text-link">
                Explore projects
                <Icon name="arrow" size={15} />
              </Link>
            </Empty>
          )}
        </section>
        <section className="panel recent-panel">
          <div className="section-heading">
            <h2>Recent activity</h2>
            <span className="activity-live">
              <i />
              Latest
            </span>
          </div>
          {activity.length ? (
            <div className="activity-feed">
              {activity.map((a) => (
                <div className="activity-feed-item" key={a.id}>
                  <span
                    className={`activity-feed-icon ${a.icon === "check" ? "green" : "purple"}`}
                  >
                    <Icon name={a.icon} size={15} />
                  </span>
                  <div>
                    {a.link ? (
                      <Link to={a.link}>{a.title}</Link>
                    ) : (
                      <button onClick={() => setTask(a.taskId)}>
                        {a.title}
                      </button>
                    )}
                    <p>{a.detail}</p>
                    <small>{relative(a.at)}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon="spark"
              title="The start of something good"
              description="Your team’s latest progress will show up here."
            />
          )}
        </section>
      </div>
      {(task || creating) && (
        <TaskModal
          taskId={task}
          onClose={() => {
            setTask(null);
            setCreating(false);
          }}
        />
      )}
      {workspaceModal && (
        <WorkspaceModal onClose={() => setWorkspaceModal(false)} />
      )}
    </>
  );
}
