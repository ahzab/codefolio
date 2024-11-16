import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { BASE_URL } from './constants'
import { Inter } from 'next/font/google'
import { Navbar } from './components/nav'
import Footer from './components/footer'
import './global.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Abdel Ahzab | Full Stack Engineer & Blockchain Developer',
    template: '%s | Abdel Ahzab',
  },
  description: 'Full Stack Engineer with 9+ years of experience specializing in scalable web applications, distributed systems, and blockchain technology.',
  openGraph: {
    title: 'Abdel Ahzab - Full Stack Engineer & Blockchain Developer',
    description: 'Full Stack Engineer specializing in scalable web applications and blockchain technology.',
    url: BASE_URL,
    siteName: 'Abdel Ahzab Portfolio',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: `${BASE_URL}/og.png`,
        width: 1200,
        height: 630,
        alt: 'Abdel Ahzab - Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abdel Ahzab - Full Stack Engineer',
    description: 'Full Stack Engineer specializing in scalable web applications and blockchain technology.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} scroll-smooth`}
    >
      <body className="font-sans antialiased bg-gray-950 text-gray-100">
        <div className="flex min-h-screen flex-col">
          {/* Background gradient effects */}
          <div className="fixed inset-0 -z-10 h-full w-full bg-gray-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />

          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b border-gray-800/80 bg-gray-950/75 backdrop-blur">
            <nav className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <Navbar />
            </nav>
          </header>

          {/* Main content */}
          <main className="flex-1 w-full">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
              {children}
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>

        {/* Analytics */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
