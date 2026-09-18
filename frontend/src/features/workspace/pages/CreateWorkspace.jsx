import WorkspaceForm from "../components/WorkspaceForm";

export default function CreateWorkspace() {
    return <div className="mx-auto max-w-2xl"><header className="mb-8"><p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Organisation</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Nouveau Workspace</h1><p className="mt-2 text-slate-500">Créez un espace pour organiser votre équipe et vos projets.</p></header><WorkspaceForm /></div>;
}
