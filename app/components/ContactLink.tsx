interface ContactLinkProps {
  href: string;
  icon: React.ReactNode;
  text: string;
  className?: string;
}

export const ContactLink = ({ href, icon, text, className = '' }: ContactLinkProps) => (
  <a
    href={href}
    target={href.startsWith('http') ? '_blank' : undefined}
    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
    className={`flex items-center gap-2 transition-colors ${className}`}
  >
    {icon}
    {text}
  </a>
);
