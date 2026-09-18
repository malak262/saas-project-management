import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "../shared/components/Layout";
import WorkspaceList from "../features/workspace/pages/WorkspaceList";
import CreateWorkspace from "../features/workspace/pages/CreateWorkspace";
import WorkspaceDetails from "../features/workspace/pages/WorkspaceDetails";
import EditWorkspacePage from "../features/workspace/pages/EditWorkspacePage";
import ProjectListPage from "../features/project/pages/ProjectListPage";
import CreateProjectPage from "../features/project/pages/CreateProjectPage";
import ProjectDetailsPage from "../features/project/pages/ProjectDetailsPage";
import EditProjectPage from "../features/project/pages/EditProjectPage";
function Dashboard() {
    return <h1 className="text-3xl font-bold">Dashboard</h1>;
}

function Tasks() {
    return <h1 className="text-3xl font-bold">Tasks</h1>;
}

function Notifications() {
    return <h1 className="text-3xl font-bold">Notifications</h1>;
}

export default function Router() {
    return (
        <BrowserRouter>

            <Routes>

                <Route path="/" element={<Layout />}>

                    <Route index element={<Dashboard />} />

                    <Route
                        path="workspaces"
                        element={<WorkspaceList />}
                    />

                    <Route path="projects" element={<ProjectListPage />} />
                    <Route path="projects/create" element={<CreateProjectPage />} />
                    <Route path="projects/:id" element={<ProjectDetailsPage />} />
                    <Route path="projects/:id/edit" element={<EditProjectPage />} />

                    <Route
                        path="tasks"
                        element={<Tasks />}
                    />

                    <Route
                        path="notifications"
                        element={<Notifications />}
                    />
                    <Route
                        path="workspaces/create"
                        element={<CreateWorkspace />}
                    />
                    <Route

                        path="workspaces/:id"

                        element={<WorkspaceDetails/>}

                    /> 
                    <Route

                        path="workspaces/:id/edit"

                        element={<EditWorkspacePage />}

                    />            
                </Route>

            </Routes>

        </BrowserRouter>
    );
}
