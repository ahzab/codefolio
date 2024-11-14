interface HistoryItem {
  command: string;
  response: React.ReactNode;
}

interface CommandHistoryProps {
  history: HistoryItem[];
}

export const CommandHistory = ({ history }: CommandHistoryProps) => (
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