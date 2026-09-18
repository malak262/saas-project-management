function formatDate(value) {
    if (!value || Number.isNaN(new Date(value).getTime())) return "Date d’ajout indisponible";
    return `Ajouté le ${new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))}`;
}

function memberIdentity(member, profile) {
    // `profile` is intentionally optional: a future User Service lookup can supply name/email
    // without changing the Workspace API payload, which currently exposes userId only.
    return {
        name: profile?.name || member.name || `Utilisateur #${member.userId}`,
        email: profile?.email || member.email || null,
    };
}

function WorkspaceMember({ member, profile, onRemove, onRoleChange, isUpdating }) {
    const isOwner = member.role === "OWNER";
    const identity = memberIdentity(member, profile);
    return <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base ${isOwner ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`} aria-hidden="true">👤</div><div className="min-w-0"><h3 className="truncate font-semibold text-slate-900">{identity.name}</h3><p className="mt-0.5 truncate text-sm text-slate-500">{identity.email || formatDate(member.createdAt)}</p>{identity.email && <p className="mt-0.5 text-xs text-slate-400">{formatDate(member.createdAt)}</p>}</div></div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end"><label className="sr-only" htmlFor={`member-role-${member.id}`}>Rôle de {identity.name}</label><select id={`member-role-${member.id}`} value={member.role} disabled={isUpdating} onChange={(event) => onRoleChange(member, event.target.value)} className={`rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${isOwner ? "border-amber-200 bg-amber-50 text-amber-800" : "border-blue-200 bg-blue-50 text-blue-800"}`}><option value="OWNER">OWNER</option><option value="MEMBER">MEMBER</option></select>{!isOwner && <button type="button" disabled={isUpdating} onClick={() => onRemove(member)} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50">Supprimer</button>}</div>
    </article>;
}

export default WorkspaceMember;
