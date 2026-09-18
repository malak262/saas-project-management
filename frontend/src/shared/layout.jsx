import { Link, Outlet } from "react-router-dom";

export default function Layout() {
    return (
        <div className="flex min-h-screen bg-gray-100">

            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white p-6">

                <h1 className="text-2xl font-bold mb-8">
                    SaaS PM
                </h1>

                <nav className="space-y-4">

                    <Link className="block hover:text-blue-400" to="/">
                        Dashboard
                    </Link>

                    <Link className="block hover:text-blue-400" to="/workspaces">
                        Workspaces
                    </Link>

                    <Link className="block hover:text-blue-400" to="/projects">
                        Projects
                    </Link>

                    <Link className="block hover:text-blue-400" to="/tasks">
                        Tasks
                    </Link>

                    <Link className="block hover:text-blue-400" to="/notifications">
                        Notifications
                    </Link>

                </nav>

            </aside>

            {/* Contenu */}
            <main className="flex-1 p-8">

                <Outlet />

            </main>

        </div>
    );
}