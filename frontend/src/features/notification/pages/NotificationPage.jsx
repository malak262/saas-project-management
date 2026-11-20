import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { get, put, remove, refresh } from "../../../shared/services/api";
import { useResource } from "../../../shared/hooks/useResource";
import {
  Icon,
  Button,
  Loading,
  ErrorState,
  Empty,
  useToast,
  relative,
} from "../../../shared/components/ui";
export default function NotificationPage() {
  const resource = useResource(() => get("/api/notifications"), [], 10000);
  const [filter, setFilter] = useState("all"),
    [busy, setBusy] = useState(null);
  const toast = useToast(),
    navigate = useNavigate();
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const notifications = resource.data,
    unread = notifications.filter((n) => !n.isRead),
    list = filter === "unread" ? unread : notifications;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">STAY IN THE LOOP</span>
          <h1>
            Your inbox
            {unread.length > 0 && (
              <span className="heading-count">{unread.length}</span>
            )}
          </h1>
          <p>The updates that bring your team a little closer.</p>
        </div>
        <Button
          icon="check"
          variant="secondary"
          busy={busy === "all"}
          disabled={!unread.length}
          onClick={async () => {
            setBusy("all");
            try {
              await put("/api/notifications/read-all");
              refresh();
              toast("All caught up.");
            } catch (e) {
              toast(e.message, true);
            } finally {
              setBusy(null);
            }
          }}
        >
          Mark all as read
        </Button>
      </div>
      <div className="tabs">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All updates<span>{notifications.length}</span>
        </button>
        <button
          className={filter === "unread" ? "active" : ""}
          onClick={() => setFilter("unread")}
        >
          Unread<span>{unread.length}</span>
        </button>
      </div>
      <section className="panel notifications-panel">
        {list.length ? (
          list.map((n) => (
            <div
              className={`notification-row ${!n.isRead ? "unread" : ""}`}
              key={n.id}
            >
              <span className="notification-type">
                <Icon
                  name={
                    n.title.toLowerCase().includes("comment")
                      ? "comment"
                      : n.title.toLowerCase().includes("invit")
                        ? "team"
                        : n.title.toLowerCase().includes("project")
                          ? "folder"
                          : "tasks"
                  }
                  size={20}
                />
              </span>
              <button
                className="notification-content"
                disabled={busy === n.id}
                onClick={async () => {
                  setBusy(n.id);
                  try {
                    if (!n.isRead) await put(`/api/notifications/${n.id}/read`);
                    refresh();
                    if (n.link?.startsWith("/") && !n.link.startsWith("//"))
                      navigate(n.link);
                  } catch (e) {
                    toast(e.message, true);
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                <strong>
                  {n.title}
                  {!n.isRead && <i />}
                </strong>
                <p>{n.message}</p>
                <small>{relative(n.createdAt)}</small>
              </button>
              <button
                className="icon-btn"
                aria-label="Delete notification"
                disabled={busy === n.id}
                onClick={async () => {
                  setBusy(n.id);
                  try {
                    await remove(`/api/notifications/${n.id}`);
                    refresh();
                  } catch (e) {
                    toast(e.message, true);
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                <Icon name="trash" size={17} />
              </button>
            </div>
          ))
        ) : (
          <Empty
            icon="inbox"
            title="You’re all caught up"
            description="Task assignments, comments, and team invitations will appear here."
          />
        )}
      </section>
    </>
  );
}
