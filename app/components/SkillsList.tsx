interface SkillsListProps {
  title: string
  skills: string[]
  className?: string
}

export const SkillsList = ({ title, skills, className = '' }: SkillsListProps) => (
  <div className={className}>
    <h3 className="text-lg font-medium mb-3 tracking-tight dark:text-gray-100">
      {title}
    </h3>
    <ul className="space-y-2">
      {skills.map((skill, index) => (
        <li key={index} className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400">▹</span>
          {skill}
        </li>
      ))}
    </ul>
  </div>
)
