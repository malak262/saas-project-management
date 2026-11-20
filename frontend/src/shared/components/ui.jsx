import {
  useEffect,
  useRef,
  useState,
  useId,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";

const paths = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  folder:
    "M3 7V5a2 2 0 012-2h5l2 3h7a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  check: "M5 12l4 4L19 6",
  circle: "M21 12a9 9 0 11-18 0 9 9 0 0118 0",
  tasks: "M9 5h12 M9 12h12 M9 19h12 M3 5h1 M3 12h1 M3 19h1",
  team: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M16 3a4 4 0 010 8 M22 21v-2a4 4 0 00-3-3.87 M13 7a4 4 0 11-8 0 4 4 0 018 0",
  inbox:
    "M22 12h-6l-2 3h-4l-2-3H2 M5.45 3h13.1L22 12v7a2 2 0 01-2 2H4a2 2 0 01-2-2v-7z",
  bell: "M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  search: "M21 21l-5-5 M18 10a8 8 0 11-16 0 8 8 0 0116 0",
  plus: "M12 5v14 M5 12h14",
  chevron: "M9 5l7 7-7 7",
  down: "M6 9l6 6 6-6",
  close: "M6 6l12 12 M6 18L18 6",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  more: "M5 12h.01 M12 12h.01 M19 12h.01",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  clock: "M12 8v4l3 2 M21 12a9 9 0 11-18 0 9 9 0 0118 0",
  calendar:
    "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2",
  settings:
    "M12 8a4 4 0 100 8 4 4 0 000-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z",
  logout: "M9 4H4v16h5 M10 12h11 M17 8l4 4-4 4",
  mail: "M3 5h18v14H3z M3 5l9 8 9-8",
  trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
  edit: "M16 3l5 5-12 12-6 1 1-6z M14 5l5 5",
  comment: "M21 11a9 9 0 01-9 9H3l1-6a9 9 0 1117-3",
  flag: "M4 22V3 M4 3c5-5 10 5 16 0v12c-6 5-11-5-16 0",
  board: "M3 4h18v16H3z M9 4v16 M15 4v16",
  list: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  shield: "M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6z M8 12l3 3 5-6",
  spark: "M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z",
  sun: "M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M5 19l1-1 M18 6l1-1 M17 12a5 5 0 11-10 0 5 5 0 0110 0",
  alert: "M12 8v5 M12 16h.01 M12 3L2 21h20z",
  link: "M10 13a5 5 0 007 0l4-4a5 5 0 00-7-7l-3 3 M14 11a5 5 0 00-7 0l-4 4a5 5 0 007 7l3-3",
  lock: "M5 10h14v11H5z M8 10V6a4 4 0 018 0v4",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M15 12a3 3 0 11-6 0 3 3 0 016 0",
};
export function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.circle} />
    </svg>
  );
}
export function Logo({ compact = false }) {
  return (
    <span className="brand">
      <span className="brand-mark">
        <i />
        <i />
        <i />
      </span>
      {!compact && (
        <>
          teamflow<span className="brand-dot">.</span>
        </>
      )}
    </span>
  );
}
const palette = ["#ede9fe", "#dbeafe", "#fce7f3", "#dcfce7", "#fef3c7"];
export function Avatar({ user, size = 32, className = "" }) {
  const [failed, setFailed] = useState(false);
  const name = user?.name || "Team member";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const index =
    [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return (
    <span
      className={`avatar ${className}`}
      style={{
        width: size,
        height: size,
        background: palette[index],
        fontSize: size * 0.34,
      }}
      title={name}
    >
      {user?.avatarUrl && !failed ? (
        <img
          src={user.avatarUrl}
          alt={name}
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        initials
      )}
    </span>
  );
}
export function Button({
  children,
  icon,
  variant = "primary",
  className = "",
  busy,
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      disabled={busy || props.disabled}
      {...props}
    >
      {busy ? (
        <span className="spinner small" />
      ) : (
        icon && <Icon name={icon} size={17} />
      )}
      {children}
    </button>
  );
}
export function Badge({ children, tone = "" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Field({ label, error, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error ? (
        <small className="field-error">{error}</small>
      ) : (
        hint && <small>{hint}</small>
      )}
    </label>
  );
}
export function Alert({ children }) {
  return (
    <div className="alert" role="alert">
      <Icon name="alert" size={18} />
      <span>{children}</span>
    </div>
  );
}
export function Empty({ icon = "folder", title, description, children }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={26} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Loading() {
  return (
    <div className="skeleton-page" aria-label="Loading" role="status">
      <div className="skeleton" />
      <div className="skeleton-grid">
        {[1, 2, 3].map((i) => (
          <div className="skeleton" key={i} />
        ))}
      </div>
      <div className="skeleton tall" />
    </div>
  );
}
export function ErrorState({ error, retry }) {
  return (
    <div className="error-state">
      <Alert>{error?.message || "Unable to load this page."}</Alert>
      <Button variant="secondary" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
const dialogStack = [];
export function Modal({ title, subtitle, children, onClose, wide = false }) {
  const id = useId();
  const ref = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    dialogStack.push(id);
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = ref.current;
    const focusable = () =>
      [
        ...el.querySelectorAll(
          'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]',
        ),
      ].filter((x) => x.offsetParent !== null);
    const first = el.querySelector("input,textarea,select") || focusable()[0];
    first?.focus();
    const key = (e) => {
      if (dialogStack.at(-1) !== id) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
      if (e.key === "Tab") {
        const items = focusable();
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      const position = dialogStack.indexOf(id);
      if (position !== -1) dialogStack.splice(position, 1);
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [id]);
  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        ref={ref}
      >
        <header className="modal-header">
          <div>
            <h2 id={id}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </header>
        {children}
      </section>
    </div>,
    document.body,
  );
}
const ToastContext = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let lastNotice = 0;
    const warn = () => {
      if (Date.now() - lastNotice < 60000) return;
      lastNotice = Date.now();
      const id = crypto.randomUUID();
      setItems((s) => [
        ...s,
        {
          id,
          error: true,
          message:
            "Couldn’t refresh the latest updates. Your open work is still here.",
        },
      ]);
      setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 6000);
    };
    window.addEventListener("teamflow:sync-error", warn);
    return () => window.removeEventListener("teamflow:sync-error", warn);
  }, []);
  function toast(message, error = false) {
    const id = crypto.randomUUID();
    setItems((s) => [...s, { id, message, error }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 5000);
  }
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((t) => (
          <div className={`toast ${t.error ? "toast-error" : ""}`} key={t.id}>
            <Icon name={t.error ? "alert" : "check"} size={18} />
            {t.message}
            <button
              aria-label="Dismiss notification"
              onClick={() => setItems((s) => s.filter((i) => i.id !== t.id))}
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
export function Confirm({ title, message, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  return (
    <Modal title={title} onClose={() => !busy && onClose()}>
      <div className="modal-body">
        <p>{message}</p>
        {error && <Alert>{error}</Alert>}
      </div>
      <footer className="modal-footer">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="danger"
          busy={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(e.message);
              setBusy(false);
            }
          }}
        >
          Delete
        </Button>
      </footer>
    </Modal>
  );
}
export const date = (value) =>
  value
    ? new Date(
        value.length === 10 ? `${value}T12:00:00` : value,
      ).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "No due date";
export const relative = (value) => {
  const m = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60000));
  return m < 1
    ? "Just now"
    : m < 60
      ? `${m}m ago`
      : m < 1440
        ? `${Math.floor(m / 60)}h ago`
        : `${Math.floor(m / 1440)}d ago`;
};
export const statuses = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};
