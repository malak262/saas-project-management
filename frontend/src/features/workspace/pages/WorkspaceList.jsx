import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WorkspaceCard from "../components/WorkspaceCard";
import { getWorkspaces } from "../services/workspaceApi";

function WorkspaceList() {
    const [workspaces, setWorkspaces] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchWorkspaces = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");
            setWorkspaces(await getWorkspaces());
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Impossible de charger les Workspaces. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // The GET request updates state asynchronously when it resolves.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchWorkspaces();
    }, [fetchWorkspaces]);

    return <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Organisation</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Workspaces</h1><p className="mt-2 text-slate-500">Gérez vos Workspaces et collaborez avec votre équipe.</p></div>
            <Link to="/workspaces/create" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">+ Créer un Workspace</Link>
        </header>
        {isLoading && <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white"><div className="flex items-center gap-3 text-slate-600"><span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />Chargement des Workspaces…</div></div>}
        {!isLoading && error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800"><p className="font-semibold">Impossible de charger les Workspaces.</p><p className="mt-1 text-sm">{error}</p><button type="button" onClick={() => void fetchWorkspaces()} className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400">Réessayer</button></div>}
        {!isLoading && !error && workspaces.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-700" aria-hidden="true">▦</div><h2 className="mt-4 text-lg font-semibold text-slate-900">Aucun Workspace pour le moment</h2><p className="mt-2 text-sm text-slate-500">Créez votre premier espace pour commencer à collaborer avec votre équipe.</p><Link to="/workspaces/create" className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Créer un Workspace</Link></div>}
        {!isLoading && !error && workspaces.length > 0 && <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{workspaces.map((workspace) => <WorkspaceCard key={workspace.id} {...workspace} />)}</div>}
    </div>;
}

export default WorkspaceList;
