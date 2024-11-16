import { Project } from "app/constants/projects";
import { ExternalLinkIcon } from "./icons/ExternalLinkIcon";

const ProjectCard = ({ project }: { project: Project }) => (
  <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6 hover:border-gray-700 transition-all duration-300">
    <div className="flex flex-col md:flex-row gap-6">
      {/* Image container */}
      <div className="w-full md:w-1/3">
        <div className="relative group">
          <img
            src={project.image}
            alt={project.name}
            className="rounded-lg w-full h-48 object-cover border border-gray-800 group-hover:border-gray-700 transition-all duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.png';
            }}
          />
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
            >
              <span className="text-white flex items-center gap-2">
                Visit Site <ExternalLinkIcon />
              </span>
            </a>
          )}
        </div>
      </div>

      {/* Content container */}
      <div className="w-full md:w-2/3 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent">
            {project.name}
          </h3>
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
            >
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          )}
        </div>

        <p className="text-gray-300 leading-relaxed">{project.description}</p>

        <div className="space-y-4">
          <div>
            <h4 className="text-gray-400 text-sm font-medium mb-2">Technologies</h4>
            <div className="flex flex-wrap gap-2">
              {project.tech.map((tech, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-xs font-medium bg-gray-800/50 border border-gray-700 rounded-full text-gray-300 hover:border-gray-600 hover:scale-105 transition-all duration-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-gray-400 text-sm font-medium mb-2">Key Features</h4>
            <div className="flex flex-wrap gap-2">
              {project.highlights.map((highlight, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-xs font-medium bg-blue-900/20 border border-blue-800/50 rounded-full text-blue-300 hover:border-blue-700/50 hover:scale-105 transition-all duration-200"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ProjectCard;
