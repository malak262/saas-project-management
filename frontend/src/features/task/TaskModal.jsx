import { useState } from "react";
import { get, post, put, remove, refresh } from "../../shared/services/api";
import { useResource } from "../../shared/hooks/useResource";
import { useSession } from "../../shared/store/session";
import {
  Modal,
  Button,
  Icon,
  Avatar,
  Field,
  Alert,
  Loading,
  ErrorState,
  Confirm,
  useToast,
  relative,
} from "../../shared/components/ui";
export default function TaskModal({
  taskId,
  projectId,
  initialStatus,
  onClose,
}) {
  const resource = useResource(async () => {
    const [projects, task] = await Promise.all([
      get("/api/projects"),
      taskId ? get(`/api/tasks/${taskId}`) : Promise.resolve(null),
    ]);
    return { projects, task };
  }, [taskId]);
  return (
    <Modal
      title={taskId ? "Task details" : "A new step forward"}
      subtitle={
        taskId
          ? "Keep the details clear and the conversation moving."
          : "Great projects start with one clear task."
      }
      onClose={onClose}
      wide
    >
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : (
        <TaskForm
          {...resource.data}
          projectId={projectId}
          initialStatus={initialStatus}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
function TaskForm({ task, projects, projectId, initialStatus, onClose }) {
  const user = useSession((s) => s.user),
    toast = useToast();
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    projectId: task?.projectId || projectId || projects[0]?.id || "",
    status: task?.status || initialStatus || "TODO",
    priority: task?.priority || "MEDIUM",
    assignedUser: task?.assignedUser || "",
    dueDate: task?.dueDate || "",
    labels: task?.labels.join(", ") || "",
  });
  const [version] = useState(task?.version);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [fields, setFields] = useState({}),
    [comments, setComments] = useState(task?.comments || []),
    [comment, setComment] = useState(""),
    [commentBusy, setCommentBusy] = useState(false),
    [commentError, setCommentError] = useState(null),
    [confirm, setConfirm] = useState(false);
  const project = projects.find((p) => p.id === Number(form.projectId));
  const workspace = useResource(
    () =>
      project
        ? get(`/api/workspaces/${project.workspaceId}`)
        : Promise.resolve(null),
    [project?.workspaceId],
  );
  const change = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const payload = {
        ...form,
        projectId: Number(form.projectId),
        assignedUser: form.assignedUser ? Number(form.assignedUser) : null,
        dueDate: form.dueDate || null,
        labels: form.labels
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        ...(task ? { version } : {}),
      };
      if (task) await put(`/api/tasks/${task.id}`, payload);
      else await post("/api/tasks", payload);
      toast(task ? "Task updated. Nice progress." : "Your task is ready.");
      refresh();
      onClose();
    } catch (e) {
      setError(e.message);
      setFields(e.fields);
    } finally {
      setBusy(false);
    }
  }
  async function sendComment(e) {
    e.preventDefault();
    setCommentBusy(true);
    setCommentError(null);
    try {
      const created = await post(`/api/tasks/${task.id}/comments`, {
        body: comment,
      });
      setComments((s) => [...s, created]);
      setComment("");
      refresh();
      toast("Comment added.");
    } catch (e) {
      setCommentError(e.message);
    } finally {
      setCommentBusy(false);
    }
  }
  if (projects.length === 0)
    return (
      <div className="modal-body">
        <p>Create a project before adding your first task.</p>
        <Button onClick={onClose}>Got it</Button>
      </div>
    );
  const canDelete =
    task &&
    (task.createdBy === user.id ||
      ["OWNER", "ADMIN"].includes(workspace.data?.role));
  return (
    <>
      <form onSubmit={save}>
        <div className="modal-body task-form-body">
          {error && <Alert>{error}</Alert>}
          <Field label="Task name" error={fields.title}>
            <input
              name="title"
              placeholder="What needs to happen?"
              value={form.title}
              onChange={change}
              required
              maxLength={200}
            />
          </Field>
          <Field label="Description" error={fields.description}>
            <textarea
              name="description"
              placeholder="Add context, a few details, or a definition of done…"
              rows={3}
              value={form.description}
              onChange={change}
              maxLength={10000}
            />
          </Field>
          <div className="form-grid">
            <Field label="Project" error={fields.projectId}>
              <select
                name="projectId"
                value={form.projectId}
                disabled={!!task}
                onChange={(e) => {
                  change(e);
                  setForm((s) => ({ ...s, assignedUser: "" }));
                }}
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assignee" error={fields.assignedUser}>
              <select
                name="assignedUser"
                value={form.assignedUser}
                onChange={change}
                disabled={workspace.loading}
              >
                <option value="">Unassigned</option>
                {workspace.data?.members.map((m) => (
                  <option value={m.userId} key={m.userId}>
                    {m.name}
                    {m.userId === user.id ? " (you)" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" error={fields.status}>
              <select name="status" value={form.status} onChange={change}>
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </Field>
            <Field label="Priority" error={fields.priority}>
              <select name="priority" value={form.priority} onChange={change}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </Field>
            <Field label="Due date" error={fields.dueDate}>
              <input
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={change}
              />
            </Field>
            <Field label="Labels" hint="Separate with commas. Up to 8 labels.">
              <input
                name="labels"
                placeholder="Design, Research"
                value={form.labels}
                onChange={change}
                maxLength={199}
              />
            </Field>
          </div>
          {workspace.error && <Alert>{workspace.error.message}</Alert>}
        </div>
        <footer className="modal-footer">
          {canDelete && (
            <button
              type="button"
              className="icon-btn danger-text delete-task"
              aria-label="Delete task"
              onClick={() => setConfirm(true)}
            >
              <Icon name="trash" size={18} />
            </button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            busy={busy}
            disabled={workspace.loading || !!workspace.error}
          >
            {task ? "Save changes" : "Create task"}
          </Button>
        </footer>
      </form>
      {task && (
        <section className="comments-section">
          <h3>
            <Icon name="comment" size={18} />
            Conversation <span>{comments.length}</span>
          </h3>
          {comments.length === 0 ? (
            <p className="muted">
              A little context can go a long way. Start the conversation.
            </p>
          ) : (
            <div className="comments">
              {comments.map((c) => (
                <div className="comment" key={c.id}>
                  <Avatar user={c.author} size={30} />
                  <div>
                    <div className="comment-heading">
                      <strong>{c.author?.name}</strong>
                      <span>{relative(c.createdAt)}</span>
                    </div>
                    <p>{c.body}</p>
                  </div>
                  {c.userId === user.id && (
                    <button
                      className="icon-btn comment-delete"
                      aria-label="Delete your comment"
                      onClick={async () => {
                        try {
                          await remove(
                            `/api/tasks/${task.id}/comments/${c.id}`,
                          );
                          setComments((s) => s.filter((x) => x.id !== c.id));
                          refresh();
                        } catch (e) {
                          toast(e.message, true);
                        }
                      }}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {commentError && <Alert>{commentError}</Alert>}
          <form className="comment-form" onSubmit={sendComment}>
            <Avatar user={user} size={30} />
            <textarea
              aria-label="Write a comment"
              placeholder="Share an update or ask a question…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              required
              maxLength={5000}
            />
            <Button
              busy={commentBusy}
              disabled={!comment.trim()}
              type="submit"
              icon="arrow"
              aria-label="Post comment"
            />
          </form>
        </section>
      )}
      {confirm && (
        <Confirm
          title="Delete this task?"
          message="The task and its comments will be permanently deleted."
          onClose={() => setConfirm(false)}
          onConfirm={async () => {
            await remove(`/api/tasks/${task.id}`);
            toast("Task deleted.");
            refresh();
            onClose();
          }}
        />
      )}
    </>
  );
}
