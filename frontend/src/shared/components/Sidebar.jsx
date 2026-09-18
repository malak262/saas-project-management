import { NavLink } from "react-router-dom";

function Sidebar() {

    return (

        <aside className="w-64 min-h-screen bg-slate-900 text-white p-6">

            <h1 className="text-2xl font-bold mb-10">

                🚀 SaaS PM

            </h1>

            <nav className="flex flex-col gap-4">

                <NavLink
                    to="/"
                    className="hover:text-blue-400"
                >
                    Dashboard
                </NavLink>

                <NavLink
                    to="/workspaces"
                    className="hover:text-blue-400"
                >
                    Workspaces
                </NavLink>

                <NavLink
                    to="/projects"
                    className="hover:text-blue-400"
                >
                    Projects
                </NavLink>

                <NavLink
                    to="/tasks"
                    className="hover:text-blue-400"
                >
                    Tasks
                </NavLink>

                <NavLink
                    to="/notifications"
                    className="hover:text-blue-400"
                >
                    Notifications
                </NavLink>

            </nav>

        </aside>

    );

}

export default Sidebar;