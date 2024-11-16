import { Project } from "app/constants/projects";
import { ExternalLinkIcon } from "./icons/ExternalLinkIcon";

const ProjectCard = ({ project }: { project: Project }) => (
  <article className="group relative bg-gray-900/20 backdrop-blur-sm rounded-2xl overflow-hidden">
    {/* Card Content */}
    <div className="relative z-10 p-8">
      {/* Project Image */}
      <div className="relative w-full h-48 mb-8 overflow-hidden rounded-xl">
        <img
          src={project.image}
          alt={project.name}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-image.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/80 backdrop-blur-sm text-gray-300 
                     hover:bg-white hover:text-gray-900 transform hover:-translate-y-0.5 transition-all duration-300"
          >
            <ExternalLinkIcon className="w-5 h-5" />
          </a>
        )}
      </div>

      {/* Project Info */}
      <div className="relative">
        <h3 className="text-xl font-semibold text-gray-100 mb-3 group-hover:text-blue-400 transition-colors duration-300">
          {project.name}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          {project.description}
        </p>

        {/* Technologies */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {project.tech.map((tech, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full
                         transform hover:scale-105 hover:bg-blue-500/20 transition-all duration-300"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Key Features */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Key Features</h4>
          <ul className="space-y-2">
            {project.highlights.slice(0, 3).map((highlight, index) => (
              <li
                key={index}
                className="flex items-start text-sm text-gray-400 group/item hover:text-gray-300 transition-colors duration-300"
              >
                <span className="mr-3 mt-1">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    {/* Background Effects */}
    <div className="absolute inset-0">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 
                    group-hover:opacity-100 transition-opacity duration-500" />

      {/* Animated Border */}
      <div className="absolute inset-0 rounded-2xl border border-gray-800/50 group-hover:border-blue-500/50 
                    transition-colors duration-500" />

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tl-2xl" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-500/10 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-br-2xl" />
    </div>

    {/* Hover Glow Effect */}
    <div className="absolute -inset-px bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 
                  opacity-0 group-hover:opacity-10 blur-xl transition-all duration-500" />
  </article>
);

export default ProjectCard;
