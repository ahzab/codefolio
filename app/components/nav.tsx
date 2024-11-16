import Link from 'next/link'

const navItems = {
  '/': {
    name: 'Home',
  },
  '#projects': {
    name: 'Projects',
  },
  '#skills': {
    name: 'Skills',
  },
  '#contact': {
    name: 'Contact',
  },
}

export function Navbar() {
  return (
    <div className="flex h-16 items-center justify-between">
      <Link
        href="/"
        className="font-semibold text-xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
      >
        AA
      </Link>

      <nav className="flex items-center gap-6">
        {Object.entries(navItems).map(([path, { name }]) => {
          return (
            <Link
              key={path}
              href={path}
              className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors"
            >
              {name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
