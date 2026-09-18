import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import WorkspaceMember from "../components/WorkspaceMember";
import { addMember, getWorkspaceById, removeMember, updateMemberRole } from "../services/workspaceApi";

function formatDate(value) {
    if (!value || Number.isNaN(new Date(value).getTime())) return "Date indisponible";
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function WorkspaceDetails() {
    const { id } = useParams();
    const [workspace, setWorkspace] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [userId, setUserId] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);

    const loadWorkspace = useCallback(async () => {
        try {
            setError("");
            setWorkspace(await getWorkspaceById(id));
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Impossible de charger ce Workspace.");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        // The GET request updates state asynchronously once it resolves.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadWorkspace();
    }, [loadWorkspace]);

    const handleAddMember = async (event) => {
        event.preventDefault();
        const parsedUserId = Number(userId);
        if (!Number.isInteger(parsedUserId) || parsedUserId < 1) {
            setSuccess("");
            setError("Saisissez un identifiant utilisateur valide.");
            return;
        }
        try {
            setIsUpdating(true);
            setError("");
            setSuccess("");
            await addMember(id, { userId: parsedUserId });
            setUserId("");
            await loadWorkspace();
            setSuccess(`Utilisateur #${parsedUserId} ajouté au Workspace.`);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Impossible d’ajouter ce membre.");
        } finally {
            setIsUpdating(false);
        }
    };

    const confirmRemoveMember = async () => {
        if (!memberToRemove) return;
        try {
            setIsUpdating(true);
            setError("");
            setSuccess("");
            await removeMember(id, memberToRemove.userId);
            await loadWorkspace();
            setSuccess(`Utilisateur #${memberToRemove.userId} supprimé du Workspace.`);
            setMemberToRemove(null);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Impossible de supprimer ce membre.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRoleChange = async (member, role) => {
        try {
            setIsUpdating(true);
            setError("");
            setSuccess("");
            await updateMemberRole(id, member.userId, role);
            await loadWorkspace();
            setSuccess(`Rôle de l’utilisateur #${member.userId} mis à jour.`);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Impossible de modifier ce rôle.");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) return <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white"><div className="flex items-center gap-3 text-slate-600"><span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />Chargement du Workspace…</div></div>;
    if (!workspace) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error || "Workspace introuvable."}</div>;

    const members = workspace.members || [];
    return <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/workspaces" className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"><span className="text-base" aria-hidden="true">←</span>Retour aux Workspaces</Link>
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-sm font-semibold text-blue-600">Espace de travail</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{workspace.name}</h1><p className="mt-3 text-sm text-slate-500">Créé le {formatDate(workspace.createdAt)}</p></header>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
        {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{success}</div>}
        <section aria-labelledby="workspace-information" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 id="workspace-information" className="text-xl font-semibold text-slate-900">Informations</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Propriétaire</p><p className="mt-1 font-semibold text-slate-900">Utilisateur #{workspace.ownerId}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Créé le</p><p className="mt-1 font-semibold text-slate-900">{formatDate(workspace.createdAt)}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Membres</p><p className="mt-1 font-semibold text-slate-900">{workspace.membersCount} membre{workspace.membersCount !== 1 ? "s" : ""}</p></div></div></section>
        <section aria-labelledby="workspace-members" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><h2 id="workspace-members" className="text-xl font-semibold text-slate-900">Membres</h2><p className="mt-1 text-sm text-slate-500">Gérez les personnes ayant accès à ce Workspace.</p></div><form onSubmit={handleAddMember} className="w-full lg:max-w-md"><label htmlFor="member-user-id" className="mb-2 block text-sm font-semibold text-slate-700">ID utilisateur</label><div className="flex flex-col gap-2 sm:flex-row"><input id="member-user-id" type="number" min="1" value={userId} onChange={(event) => { setUserId(event.target.value); setError(""); }} disabled={isUpdating} placeholder="Exemple : 12" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50" /><button disabled={isUpdating} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{isUpdating ? "Mise à jour…" : "Ajouter"}</button></div><p className="mt-2 text-xs leading-5 text-slate-500">L’ajout utilise temporairement un ID utilisateur. La recherche par nom ou email sera ajoutée avec le User Service.</p></form></div><div className="mt-6 space-y-3">{members.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Aucun membre dans ce Workspace.</div> : members.map((member) => <WorkspaceMember key={member.id} member={member} onRemove={setMemberToRemove} onRoleChange={handleRoleChange} isUpdating={isUpdating} />)}</div></section>
        {memberToRemove && <div role="dialog" aria-modal="true" aria-labelledby="remove-member-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 id="remove-member-title" className="text-lg font-semibold text-slate-900">Supprimer ce membre ?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Voulez-vous vraiment retirer l’utilisateur #{memberToRemove.userId} de ce Workspace ? Cette action sera confirmée par le serveur.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={isUpdating} onClick={() => setMemberToRemove(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50">Annuler</button><button type="button" disabled={isUpdating} onClick={() => void confirmRemoveMember()} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">{isUpdating ? "Suppression…" : "Supprimer"}</button></div></div></div>}
    </div>;
}

export default WorkspaceDetails;
