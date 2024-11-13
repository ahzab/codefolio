'use client'

import { useState, useEffect, useRef } from 'react'
import { ContactLink } from "./components/ContactLink"
import { GradientText } from "./components/GradientText"
import { EmailIcon } from "./components/icons/EmailIcon"
import { GithubIcon } from "./components/icons/GithubIcon"
import { SkillsList } from "./components/SkillsList"
import { technicalSkills, specializedSkills } from "./constants"

const TerminalHeader = () => (
  <div className="bg-gray-700 px-4 py-2 flex items-center">
    <div className="flex space-x-2">
      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
    </div>
    <div className="mx-auto text-gray-400 text-sm">terminal</div>
  </div>
)

const CommandInput = ({
  currentCommand,
  onCommandChange,
  onSubmit
}: {
  currentCommand: string;
  onCommandChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) => (
  <form onSubmit={onSubmit} className="flex">
    <span className="text-gray-400">$ </span>
    <input
      type="text"
      value={currentCommand}
      onChange={(e) => onCommandChange(e.target.value)}
      className="flex-1 ml-2 bg-transparent outline-none  border-none text-green-400 "
      autoFocus
    />
  </form>
)

const CommandHistory = ({
  history
}: {
  history: Array<{ command: string; response: React.ReactNode }>
}) => (
  <div className="space-y-4">
    {history.map((item, index) => (
      <div key={index} className="mb-4">
        <div className="flex">
          <span className="text-gray-400">$ </span>
          <span className="ml-2">{item.command}</span>
        </div>
        {item.response && (
          <div className="mt-2">{item.response}</div>
        )}
      </div>
    ))}
  </div>
)

export default function Page() {
  const [commandHistory, setCommandHistory] = useState<Array<{ command: string; response: React.ReactNode }>>([])
  const [currentCommand, setCurrentCommand] = useState('')
  const [welcomeText, setWelcomeText] = useState('')
  const [welcomeComplete, setWelcomeComplete] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)


  const commands = {
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
    clear: {
      description: 'Clear terminal',
      execute: () => {
        setCommandHistory([])
        return null
      }
    }
  }

  const executeCommandWithDelay = (command: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setCommandHistory(prev => [...prev, {
            command: command,
            response: commands[command as keyof typeof commands].execute()
          }])
          resolve()
        }, delay)
      })
    }

  useEffect(() => {
    const fullWelcomeText = "Welcome to Abdel Ahzab's Terminal\nType 'help' to see available commands."
    let currentText = '';
    let currentIndex = 0;

    const timer = setInterval(() => {
      if (currentIndex < fullWelcomeText.length) {
        currentText += fullWelcomeText[currentIndex];
        setWelcomeText(currentText);
        currentIndex++;
      } else {
        clearInterval(timer);
        setWelcomeComplete(true);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

    useEffect(() => {
      if (welcomeComplete) {
        const runInitialCommands = async () => {
          await executeCommandWithDelay('whoami', 500)
          await executeCommandWithDelay('help', 1000)
        }

        runInitialCommands()
      }
    }, [welcomeComplete])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [commandHistory])

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedCommand = currentCommand.trim().toLowerCase()

    const newHistoryItem = {
      command: currentCommand,
      response: null as React.ReactNode
    }

    if (trimmedCommand) {
      if (trimmedCommand in commands) {
        newHistoryItem.response = commands[trimmedCommand as keyof typeof commands].execute()
      } else {
        newHistoryItem.response = (
          <div className="text-red-400">
            Command not found. Type 'help' to see available commands.
          </div>
        )
      }
    }

    setCommandHistory(prev => [...prev, newHistoryItem])
    setCurrentCommand('')
  }

  return (
    <div className="bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl mt-0 md:mt-10">
          <TerminalHeader />
          <div
            ref={containerRef}
            className="p-6 font-mono text-green-400 h-[632px] overflow-y-auto"
          >
            <div className="mb-4">
              {welcomeText.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <CommandHistory history={commandHistory} />
            <CommandInput
              currentCommand={currentCommand}
              onCommandChange={setCurrentCommand}
              onSubmit={handleCommand}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
