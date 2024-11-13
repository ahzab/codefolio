import { Project } from "app/constants/projects";

const ProjectCard = ({ project }: { project: Project }) => (
  <div className="border border-gray-700 rounded-lg p-4 mb-4">
    <h3 className="text-xl text-blue-400 font-semibold mb-2">{project.name}</h3>
    <p className="text-gray-300 mb-3">{project.description}</p>
    <div className="mb-2">
      <span className="text-gray-400 text-sm">Technologies: </span>
      <span className="text-gray-300 text-sm">{project.tech.join(", ")}</span>
    </div>
    <div>
      <span className="text-gray-400 text-sm">Key Features: </span>
      <span className="text-gray-300 text-sm">{project.highlights.join(", ")}</span>
    </div>
  </div>
);

export default ProjectCard;
