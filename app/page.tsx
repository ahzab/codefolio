'use client'

import { useState, useEffect, useRef } from 'react'
import { CommandHistory } from './components/CommandHistory'
import { CommandInput } from './components/CommandInput'
import { createCommands } from './constants/commands'
import { TerminalHeader } from './components/TerminalHeader'



export default function Page() {
  const [commandHistory, setCommandHistory] = useState<Array<{ command: string; response: React.ReactNode }>>([])
  const [currentCommand, setCurrentCommand] = useState('')
  const [welcomeText, setWelcomeText] = useState('')
  const [welcomeComplete, setWelcomeComplete] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)


  const commands = createCommands(() =>  setCommandHistory([]))

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
