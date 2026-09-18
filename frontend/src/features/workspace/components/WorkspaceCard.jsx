import { Link } from "react-router-dom";

function formatDate(value) {
    if (!value || Number.isNaN(new Date(value).getTime())) return null;
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function WorkspaceCard({ id, name, membersCount, createdAt, ownerId }) {
    const createdDate = formatDate(createdAt);
    return <article className="group flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
        <div className="flex items-start justify-between gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-700" aria-hidden="true">{name?.trim()?.charAt(0)?.toUpperCase() || "W"}</div>{ownerId && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Propriétaire #{ownerId}</span>}</div>
        <div className="mt-5"><h2 className="truncate text-lg font-semibold text-slate-900">{name}</h2><p className="mt-2 text-sm leading-6 text-slate-500">Espace de travail partagé pour organiser votre équipe et vos projets.</p></div>
        <div className="mt-5 space-y-2 text-sm text-slate-600"><p className="flex items-center gap-2"><span aria-hidden="true">👥</span>{membersCount} membre{membersCount !== 1 ? "s" : ""}</p>{createdDate && <p className="flex items-center gap-2"><span aria-hidden="true">📅</span>Créé le {createdDate}</p>}</div>
        <Link to={`/workspaces/${id}`} className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Ouvrir le Workspace <span className="text-base transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span></Link>
    </article>;
}

export default WorkspaceCard;
