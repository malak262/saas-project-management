import { Link } from "react-router-dom";

export default function EditWorkspacePage() {
    return (
        <div className="rounded-xl bg-white p-8 shadow">
            <h1 className="text-2xl font-bold">Modification indisponible</h1>
            <p className="mt-2 text-gray-600">La modification des informations d’un workspace n’est pas encore proposée par l’API.</p>
            <Link to="/workspaces" className="mt-5 inline-block text-blue-600 hover:text-blue-800">Retour aux workspaces</Link>
        </div>
    );
}
