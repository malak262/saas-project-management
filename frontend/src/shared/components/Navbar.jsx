export default function Navbar() {
    return (
        <header className="bg-white shadow-sm rounded-xl px-6 py-4 flex justify-between items-center">

            {/* Titre */}
            <h1 className="text-2xl font-bold text-gray-800">
                Workspace Manager
            </h1>

            {/* Partie droite */}
            <div className="flex items-center gap-6">

                <button className="text-2xl hover:scale-110 transition">
                    🔔
                </button>

                <div className="flex items-center gap-2">

                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        M
                    </div>

                    <div>
                        <p className="font-semibold">
                            Malika
                        </p>

                        <p className="text-sm text-gray-500">
                            MEMBER
                        </p>
                    </div>

                </div>

            </div>

        </header>
    );
}