export interface Command {
  description: string;
  execute: () => React.ReactNode;
}

export interface CommandHistoryItem {
  command: string;
  response: React.ReactNode;
}

export type Commands = {
  [key: string]: Command;
}; 