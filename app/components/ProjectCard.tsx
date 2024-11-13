import { Project } from "app/constants/projects";

const ProjectCard = ({ project }: { project: Project }) => (
  <div className="border border-gray-700 rounded-lg p-4 mb-4">
    <div className="flex flex-col md:flex-row gap-4">
      {/* Image container */}
      <div className="w-full md:w-1/3">
        <img
          src={project.image}
          alt={project.name}
          className="rounded-lg w-full h-48 object-cover border border-gray-700"
          onError={(e) => {
            // Fallback if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-image.png'; // Add a placeholder image
          }}
        />
      </div>

      {/* Content container */}
      <div className="w-full md:w-2/3">
        <h3 className="text-xl text-yellow-400 font-semibold mb-2">
          {project.name}
        </h3>
        <p className="text-gray-300 mb-3">{project.description}</p>

        <div className="mb-2">
          <span className="text-gray-400 text-sm">Technologies: </span>
          <div className="flex flex-wrap gap-2 mt-1">
            {project.tech.map((tech, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-700 rounded-full text-gray-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-gray-400 text-sm">Key Features: </span>
          <div className="flex flex-wrap gap-2 mt-1">
            {project.highlights.map((highlight, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-700 rounded-full text-gray-300"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);


export default ProjectCard;
