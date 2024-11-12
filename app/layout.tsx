import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Footer from './components/footer'
import { BASE_URL } from './constants'
import { Inter } from 'next/font/google'
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
      className={`${inter.variable} text-black bg-white dark:text-white dark:bg-black`}
    >
      <body className="font-sans antialiased max-w-2xl mx-4 mt-8 lg:mx-auto min-h-screen flex flex-col">
        <main className="flex-1 flex flex-col px-2 md:px-0">
          {children}
        </main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
