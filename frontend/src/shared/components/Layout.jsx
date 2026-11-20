import { useEffect, useState } from "react";
import {
  NavLink,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { get } from "../services/api";
import { useResource } from "../hooks/useResource";
import { useSession } from "../store/session";
import { Logo, Icon, Avatar } from "./ui";
export default function Layout() {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const location = useLocation(),
    navigate = useNavigate();
  const { user, signOut, updateUser } = useSession();
  const { data: projects } = useResource(() => get("/api/projects"));
  const { data: unread } = useResource(
    () => get("/api/notifications/unread-count"),
    [],
    10000,
  );
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    get("/api/users/me")
      .then(updateUser)
      .catch(() => {});
  }, [updateUser]);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  const links = [
    ["/", "grid", "Overview"],
    ["/projects", "folder", "Projects"],
    ["/tasks", "tasks", "My tasks"],
    ["/workspaces", "team", "Workspaces"],
    ["/notifications", "inbox", "Inbox"],
  ];
  if (user?.role === "ADMIN")
    links.push(["/admin", "shield", "Administration"]);
  const title = location.pathname.startsWith("/projects/")
    ? "Project workspace"
    : links.find(([p]) => p !== "/" && location.pathname.startsWith(p))?.[2] ||
      (location.pathname === "/settings" ? "Settings" : "Overview");
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Link className="sidebar-brand" to="/">
          <Logo />
        </Link>
        <div className="workspace-label">
          <span className="workspace-symbol">
            <Icon name="team" size={19} />
          </span>
          <span>
            <strong>Your workspace</strong>
            <small>Let’s make things happen</small>
          </span>
        </div>
        <span className="nav-caption">WORKSPACE</span>
        <nav aria-label="Main navigation">
          {links.map(([path, icon, label]) => (
            <NavLink
              key={path}
              to={path === "/tasks" ? "/tasks?mine=1" : path}
              end={path === "/"}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon name={icon} size={19} />
              <span>{label}</span>
              {path === "/notifications" && unread?.count > 0 && (
                <span className="nav-count">
                  {unread.count > 99 ? "99+" : unread.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-projects">
          <div className="nav-caption">
            YOUR PROJECTS
            <Link to="/projects" aria-label="Browse projects">
              <Icon name="plus" size={16} />
            </Link>
          </div>
          {projects?.slice(0, 4).map((p) => (
            <Link
              key={p.id}
              className="project-shortcut"
              to={`/projects/${p.id}`}
            >
              <i style={{ background: p.color }} />
              <span>{p.name}</span>
            </Link>
          ))}
          {projects?.length === 0 && (
            <p className="sidebar-empty">
              Your next big idea starts
              <br />
              with a project.
            </p>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="focus-note">
            <Icon name="spark" size={21} />
            <strong>Find your flow.</strong>
            <p>
              Small steps today.
              <br />
              Great things tomorrow.
            </p>
          </div>
          <NavLink to="/settings" className="nav-link">
            <Icon name="settings" size={19} />
            Settings
          </NavLink>
          <div className="sidebar-profile">
            <Link to="/settings">
              <Avatar user={user} size={35} />
              <span>
                <strong>{user?.name}</strong>
                <small>Personal account</small>
              </span>
            </Link>
            <button
              className="icon-btn"
              aria-label="Sign out"
              onClick={signOut}
            >
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn mobile-menu"
              aria-label="Open navigation"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <Icon name="menu" />
            </button>
            <span className="topbar-workspace">Workspace</span>
            <Icon name="chevron" size={14} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <form
              className="global-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/tasks?q=${encodeURIComponent(query)}`);
              }}
            >
              <Icon name="search" size={17} />
              <input
                aria-label="Search tasks"
                placeholder="Search anything…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>?</kbd>
            </form>
            <Link
              className="icon-btn notification-button"
              to="/notifications"
              aria-label={`Inbox, ${unread?.count || 0} unread notifications`}
            >
              <Icon name="bell" size={20} />
              {unread?.count > 0 && <i />}
            </Link>
            <span className="topbar-divider" />
            <Link to="/settings" aria-label="Your profile">
              <Avatar user={user} size={33} />
            </Link>
          </div>
        </header>
        <main id="main-content" className="page-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>A little clarity goes a long way.</span>
          <span>
            <i /> Teamflow
          </span>
        </footer>
      </div>
    </div>
  );
}
