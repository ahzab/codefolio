interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export const GradientText = ({ children, className = '' }: GradientTextProps) => (
  <span className={`bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
);
