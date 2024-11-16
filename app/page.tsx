'use client'

import { projects } from './constants/projects'
import ProjectCard from './components/ProjectCard'
import { technicalSkills, specializedSkills } from './constants'
import { SkillsList } from './components/SkillsList'
import { GitHubIcon, MailIcon } from './components/icons'

export default function Page() {
  return (
    <main className="relative">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3e3e3e,transparent)]" />
      </div>

      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Abdel Ahzab
            </h1>
            <h2 className="text-2xl md:text-3xl text-gray-200 font-light mb-8">
              Full Stack Engineer & Blockchain Developer
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mb-12">
              Passionate Full Stack Engineer with 9+ years of experience building innovative
              digital solutions. Specializing in scalable web applications, distributed systems,
              and blockchain technology.
            </p>
            <div className="flex gap-6">
              <a
                href="mailto:abdou.ahzab@gmail.com"
                className="flex items-center gap-2 px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
              >
                <MailIcon className="w-5 h-5" />
                Contact Me
              </a>
              <a
                href="https://github.com/ahzab"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg transition-all"
              >
                <GitHubIcon className="w-5 h-5" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-24 bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col items-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Skills & Expertise</h2>
            <div className="h-1 w-20 bg-blue-500/50 rounded-full" />
          </div>
          <div className="grid md:grid-cols-2 gap-16">
            <SkillsList
              title="Technical Skills"
              skills={technicalSkills}
              className="text-gray-300"
            />
            <SkillsList
              title="Specialized Skills"
              skills={specializedSkills}
              className="text-gray-300"
            />
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Featured Projects</h2>
            <div className="h-1 w-20 bg-blue-500/50 rounded-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <ProjectCard key={index} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold mb-4">Let's Connect</h2>
            <div className="h-1 w-20 bg-blue-500/50 rounded-full mb-8" />
            <p className="text-gray-400 max-w-2xl mb-8">
              I'm always interested in hearing about new projects and opportunities.
              Feel free to reach out if you'd like to collaborate or just want to say hello!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:abdou.ahzab@gmail.com"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
              >
                <MailIcon className="w-5 h-5" />
                abdou.ahzab@gmail.com
              </a>
              <a
                href="https://github.com/ahzab"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg transition-all"
              >
                <GitHubIcon className="w-5 h-5" />
                GitHub Profile
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
