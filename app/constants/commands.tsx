import { Commands } from '../types/commands';
import { GradientText } from "../components/GradientText";
import { ContactLink } from "../components/ContactLink";
import { EmailIcon } from "../components/icons/EmailIcon";
import { GithubIcon } from "../components/icons/GithubIcon";
import { SkillsList } from "../components/SkillsList";
import { technicalSkills, specializedSkills } from "./index";
import { projects } from './projects';
import ProjectCard from '../components/ProjectCard';

export const createCommands = (clearHistory: () => void): Commands => ( {
    help: {
      description: 'Show available commands',
      execute: () => (
        <div className="text-gray-400 text-sm">
          <p className="font-semibold mb-1">Available commands:</p>
          <ul className="ml-4">
            <li><span className="text-yellow-500">help</span> - Show available commands</li>
            <li><span className="text-yellow-500">whoami</span> - Display profile information</li>
            <li><span className="text-yellow-500">skills</span> - List technical skills</li>
            <li><span className="text-yellow-500">focus</span> - Show current focus</li>
            <li><span className="text-yellow-500">contact</span> - Show contact information</li>
            <li><span className="text-yellow-500">clear</span> - Clear terminal</li>
          </ul>
        </div>
      )
    },
    whoami: {
      description: 'Display profile information',
      execute: () => (
        <div className="ml-4">
          <div className="mb-2">
            <GradientText className='block mb-4 text-2xl md:text-3x'>Abdel Ahzab</GradientText>
            <div className="text-gray-300 font-semibold">Full Stack Engineer & Blockchain Developer</div>
          </div>
          <div className="text-gray-300 mt-4">
            Passionate Full Stack Engineer with 9+ years of experience building innovative
            digital solutions. Specializing in scalable web applications, distributed systems,
            and blockchain technology. I combine technical expertise with a strong product mindset
            to deliver impactful solutions that drive business value.
          </div>
        </div>
      )
    },
    contact: {
      description: 'Show contact information',
      execute: () => (
        <div className="ml-4 flex space-x-4">
          <ContactLink
            href="mailto:abdou.ahzab@gmail.com"
            icon={<EmailIcon />}
            text="abdou.ahzab@gmail.com"
            className="text-blue-400 hover:text-blue-300"
          />
          <ContactLink
            href="https://github.com/ahzab"
            icon={<GithubIcon />}
            text="GitHub"
            className="text-blue-400 hover:text-blue-300"
          />
        </div>
      )
    },
    skills: {
      description: 'List technical skills',
      execute: () => (
        <div className="ml-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkillsList
            title="Technical Skills"
            skills={technicalSkills}
            className="text-gray-300"
          />
          <SkillsList
            title="Specialized Focus"
            skills={specializedSkills}
            className="text-gray-300"
          />
        </div>
      )
    },
    focus: {
      description: 'Show current focus',
      execute: () => (
        <div className="ml-4 text-gray-300">
          Currently exploring cutting-edge blockchain protocols and developing
          decentralized applications that bridge the gap between Web2 and Web3 technologies.
          Passionate about building secure, scalable, and user-centric solutions.
        </div>
      )
    },
    projects: {
        description: 'Show featured projects',
        execute: () => (
          <div className="ml-4">
            <h2 className="text-lg mb-4 text-white">Featured Projects:</h2>
            <div className="space-y-4">
              {projects.map((project, index) => (
                <ProjectCard key={index} project={project} />
              ))}
            </div>
          </div>
        )
      },
    clear: {
      description: 'Clear terminal',
      execute: () => {
        clearHistory()
        return null
      }
    }
  }); 