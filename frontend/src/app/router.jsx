import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes } from "react-router-dom";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import SignInPage from "../features/auth/pages/SignInPage";
import SignUpPage from "../features/auth/pages/SignUpPage";

const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/dashboard/users", label: "Users" },
    { to: "/dashboard/workspaces", label: "Workspaces" },
    { to: "/dashboard/projects", label: "Projects" },
    { to: "/dashboard/tasks", label: "Tasks" },
    { to: "/dashboard/notifications", label: "Notifications" },
];

function Section({ title, description }) {
    return (
        <section className="page-card">
            <h2>{title}</h2>
            <p>{description}</p>
        </section>
    );
}

function ConsoleLayout() {
    return (
        <div className="shell">
            <header className="topbar">
                <div>
                    <p className="eyebrow">SaaS Project Management</p>
                    <h1>Operations Console</h1>
                </div>
                <nav className="nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/dashboard"}
                            className={({ isActive }) =>
                                `nav-link${isActive ? " active" : ""}`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </header>

            <main className="content">
                <Outlet />
            </main>
        </div>
    );
}

export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/sign-in" element={<SignInPage />} />
                <Route path="/sign-up" element={<SignUpPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/" element={<Navigate to="/sign-in" replace />} />
                <Route path="/dashboard" element={<ConsoleLayout />}>
                    <Route
                        index
                        element={
                            <Section
                                title="Dashboard"
                                description="Overview of the platform, service health, and recent activity."
                            />
                        }
                    />
                    <Route
                        path="users"
                        element={
                            <Section
                                title="Users"
                                description="Manage application users and access to the platform."
                            />
                        }
                    />
                    <Route
                        path="workspaces"
                        element={
                            <Section
                                title="Workspaces"
                                description="Track workspace-level organization and ownership."
                            />
                        }
                    />
                    <Route
                        path="projects"
                        element={
                            <Section
                                title="Projects"
                                description="View project pipelines and delivery status."
                            />
                        }
                    />
                    <Route
                        path="tasks"
                        element={
                            <Section
                                title="Tasks"
                                description="Follow task progress across active workstreams."
                            />
                        }
                    />
                    <Route
                        path="notifications"
                        element={
                            <Section
                                title="Notifications"
                                description="Monitor system alerts and user notifications."
                            />
                        }
                    />
                </Route>
                <Route path="*" element={<Navigate to="/sign-in" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
