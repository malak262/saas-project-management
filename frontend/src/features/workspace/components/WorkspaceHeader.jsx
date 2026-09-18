function WorkspaceHeader({ workspace }) {

    return (

        <div className="bg-white rounded-xl shadow-lg p-8">

            <h1 className="text-3xl font-bold text-gray-800">

                {workspace.name}

            </h1>

            <p className="text-gray-500 mt-2">

                {workspace.description}

            </p>

            <div className="mt-6 flex gap-8">

                <div>

                    <p className="text-sm text-gray-500">

                        Owner

                    </p>

                    <p className="font-semibold">

                        👑 {workspace.owner}

                    </p>

                </div>

                <div>

                    <p className="text-sm text-gray-500">

                        Membres

                    </p>

                    <p className="font-semibold">

                        👥 {workspace.members.length}

                    </p>

                </div>

                <div>

                    <p className="text-sm text-gray-500">

                        Projects

                    </p>

                    <p className="font-semibold">

                        📁 {workspace.projects.length}

                    </p>

                </div>

            </div>

        </div>

    );

}

export default WorkspaceHeader;