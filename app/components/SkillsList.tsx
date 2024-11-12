interface SkillsListProps {
  title: string;
  skills: string[];
}

export const SkillsList = ({ title, skills }: SkillsListProps) => (
  <div>
    <h3 className="text-lg font-medium mb-3">{title}</h3>
    <ul className="space-y-2">
      {skills.map((skill, index) => (
        <li key={index} className="flex items-center gap-2">
          <span className="text-blue-600">▹</span>
          {skill}
        </li>
      ))}
    </ul>
  </div>
);
