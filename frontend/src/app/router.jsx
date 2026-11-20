import { Component } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useSession } from "../shared/store/session";
import { ToastProvider, Logo, Button } from "../shared/components/ui";
import Layout from "../shared/components/Layout";
import { AuthPage, OAuthCallback } from "../features/auth/AuthPages";
import Dashboard from "../features/dashboard/Dashboard";
import WorkspacesPage, {
  WorkspaceDetailsPage,
} from "../features/workspace/WorkspacePages";
import ProjectsPage, {
  ProjectDetailsPage,
} from "../features/project/ProjectPages";
import TasksPage from "../features/task/TasksPage";
import NotificationPage from "../features/notification/pages/NotificationPage";
import SettingsPage from "../features/settings/SettingsPage";
import AdminPage from "../features/settings/AdminPage";
function Protected() {
  const token = useSession((s) => s.token);
  return token ? <Layout /> : <Navigate to="/login" replace />;
}
class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error, info) {
    console.error("Teamflow rendering error", error, info);
  }
  render() {
    return this.state.error ? (
      <main className="callback-page">
        <Logo />
        <h1>A small interruption.</h1>
        <p>Reload Teamflow to get back to your work.</p>
        <Button onClick={() => window.location.reload()}>
          Reload Teamflow
        </Button>
      </main>
    ) : (
      this.props.children
    );
  }
}
function NotFound() {
  return (
    <main className="callback-page">
      <Logo />
      <span className="eyebrow">404 · A LITTLE OFF TRACK</span>
      <h1>Let’s find your flow again.</h1>
      <p>This page has moved, or it doesn’t exist.</p>
      <Link className="btn btn-primary" to="/">
        Back to overview
      </Link>
    </main>
  );
}
export default function Router() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthPage key="login" />} />
            <Route
              path="/register"
              element={<AuthPage register key="register" />}
            />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route element={<Protected />}>
              <Route index element={<Dashboard />} />
              <Route path="workspaces" element={<WorkspacesPage />} />
              <Route
                path="workspaces/create"
                element={<Navigate to="/workspaces?new=1" replace />}
              />
              <Route path="workspaces/:id" element={<WorkspaceDetailsPage />} />
              <Route
                path="workspaces/:id/edit"
                element={<Navigate to="/workspaces" replace />}
              />
              <Route path="projects" element={<ProjectsPage />} />
              <Route
                path="projects/create"
                element={<Navigate to="/projects?new=1" replace />}
              />
              <Route path="projects/:id" element={<ProjectDetailsPage />} />
              <Route
                path="projects/:id/edit"
                element={<Navigate to="/projects" replace />}
              />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="notifications" element={<NotificationPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
