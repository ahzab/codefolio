'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Astronaut from './components/404/Astronaut'
import FloatingObjects from './components/404/FloatingObjects'


export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="max-w-2xl w-full text-center relative">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <FloatingObjects />
          </motion.div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <Astronaut />

          <motion.h1
            className="text-7xl font-bold mb-4 tracking-tighter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            4
            <motion.span
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block"
            >
              0
            </motion.span>
            4
          </motion.h1>

          <motion.p
            className="text-2xl text-gray-600 dark:text-gray-300 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Lost in Space
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-4"
          >
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              The page you're looking for has drifted into deep space
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium transition-all duration-200 hover:from-blue-600 hover:to-purple-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
              </svg>
              Return to Earth
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
