interface CommandInputProps {
  currentCommand: string;
  onCommandChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CommandInput = ({
  currentCommand,
  onCommandChange,
  onSubmit
}: CommandInputProps) => (
  <form onSubmit={onSubmit} className="flex">
    <span className="text-gray-400">$ </span>
    <input
      type="text"
      value={currentCommand}
      onChange={(e) => onCommandChange(e.target.value)}
      className="flex-1 ml-2 bg-transparent outline-none border-none text-green-400"
      autoFocus
    />
  </form>
) 