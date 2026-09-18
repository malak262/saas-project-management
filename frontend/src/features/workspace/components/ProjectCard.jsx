function ProjectCard({ project }) {

    return (

        <div className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">

            <h3 className="font-semibold">

                📁 {project.name}

            </h3>

        </div>

    );

}

export default ProjectCard;