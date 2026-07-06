import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";

const navItems = [
    { to: "/", label: "Dashboard" },
    { to: "/users", label: "Users" },
    { to: "/workspaces", label: "Workspaces" },
    { to: "/projects", label: "Projects" },
    { to: "/tasks", label: "Tasks" },
    { to: "/notifications", label: "Notifications" },
];

function Section({ title, description }) {
    return (
        <section className="page-card">
            <h2>{title}</h2>
            <p>{description}</p>
        </section>
    );
}

export default function Router() {
    return (
        <BrowserRouter>
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
                                end={item.to === "/"}
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
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Section
                                    title="Dashboard"
                                    description="Overview of the platform, service health, and recent activity."
                                />
                            }
                        />
                        <Route
                            path="/users"
                            element={
                                <Section
                                    title="Users"
                                    description="Manage application users and access to the platform."
                                />
                            }
                        />
                        <Route
                            path="/workspaces"
                            element={
                                <Section
                                    title="Workspaces"
                                    description="Track workspace-level organization and ownership."
                                />
                            }
                        />
                        <Route
                            path="/projects"
                            element={
                                <Section
                                    title="Projects"
                                    description="View project pipelines and delivery status."
                                />
                            }
                        />
                        <Route
                            path="/tasks"
                            element={
                                <Section
                                    title="Tasks"
                                    description="Follow task progress across active workstreams."
                                />
                            }
                        />
                        <Route
                            path="/notifications"
                            element={
                                <Section
                                    title="Notifications"
                                    description="Monitor system alerts and user notifications."
                                />
                            }
                        />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}