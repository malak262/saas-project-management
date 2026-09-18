import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createWorkspace } from "../services/workspaceApi";

function WorkspaceForm() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!name.trim()) { setError("Le nom du Workspace est obligatoire."); return; }
        try {
            setIsSubmitting(true); setError("");
            // Conservé : l’API actuelle reçoit ownerId jusqu’au branchement de l’authentification JWT.
            await createWorkspace({ name: name.trim(), ownerId: 1 });
            navigate("/workspaces");
        } catch (requestError) { setError(requestError.response?.data?.message || "La création du Workspace a échoué."); }
        finally { setIsSubmitting(false); }
    };
    return <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="border-b border-slate-100 pb-6"><h2 className="text-xl font-semibold text-slate-900">Créer un Workspace</h2><p className="mt-2 text-sm leading-6 text-slate-500">Créez un espace de travail pour collaborer avec votre équipe et gérer vos projets.</p></div>
        <div className="mt-6"><label htmlFor="workspace-name" className="mb-2 block text-sm font-semibold text-slate-700">Nom du Workspace</label><input id="workspace-name" type="text" value={name} onChange={(event) => { setName(event.target.value); if (error) setError(""); }} disabled={isSubmitting} autoFocus placeholder="Exemple : Équipe Marketing" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50" />{error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}</div>
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link to="/workspaces" className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Annuler</Link><button type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Création en cours…" : "Créer le Workspace"}</button></div>
    </form>;
}

export default WorkspaceForm;
