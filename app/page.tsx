'use client'

import { motion } from 'framer-motion'
import { ContactLink } from "./components/ContactLink"
import { GradientText } from "./components/GradientText"
import { EmailIcon } from "./components/icons/EmailIcon"
import { GithubIcon } from "./components/icons/GithubIcon"
import { SkillsList } from "./components/SkillsList"
import { technicalSkills, specializedSkills } from "./constants"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

const slideVariants = {
  hidden: { x: -50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
}

const fadeInVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

export default function Page() {
  return (
    <motion.section
      className="flex items-center py-20"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <motion.h1
          className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight"
          variants={itemVariants}
        >
          <GradientText>Abdel Ahzab</GradientText>
        </motion.h1>

        {/* Contact Links */}
        <motion.div
          className="flex flex-wrap items-center gap-4 mb-8"
          variants={itemVariants}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ContactLink
              href="mailto:abdou.ahzab@gmail.com"
              icon={<EmailIcon />}
              text="abdou.ahzab@gmail.com"
              aria-label="Email Abdel Ahzab"
            />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ContactLink
              href="https://github.com/ahzab"
              icon={<GithubIcon />}
              text="GitHub"
              className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              aria-label="Visit GitHub profile"
            />
          </motion.div>
        </motion.div>

        {/* Role */}
        <motion.div
          className="text-xl md:text-4xl font-semibold mb-8 tracking-tight"
          variants={slideVariants}
        >
          <motion.p
            className="mb-2 dark:text-gray-100"
            variants={itemVariants}
          >
            Full Stack Engineer
          </motion.p>
          <motion.div variants={itemVariants}>
            <GradientText>&amp; Blockchain Developer</GradientText>
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          className="space-y-8"
          variants={containerVariants}
        >
          {/* Bio */}
          <motion.p
            className="text-lg max-w-3xl leading-relaxed text-gray-600 dark:text-gray-300"
            variants={fadeInVariants}
          >
            Passionate Full Stack Engineer with 9+ years of experience building innovative
            digital solutions. Specializing in scalable web applications, distributed systems,
            and blockchain technology. I combine technical expertise with a strong product mindset
            to deliver impactful solutions that drive business value.
          </motion.p>

          {/* Expertise */}
          <motion.div
            className="max-w-3xl"
            variants={containerVariants}
          >
            <motion.h2
              className="text-2xl font-semibold mb-6 tracking-tight dark:text-gray-100"
              variants={itemVariants}
            >
              Core Expertise
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={containerVariants}
            >
              <motion.div
                variants={slideVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <SkillsList
                  title="Technical Skills"
                  skills={technicalSkills}
                  className="dark:text-gray-300"
                />
              </motion.div>
              <motion.div
                variants={slideVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <SkillsList
                  title="Specialized Focus"
                  skills={specializedSkills}
                  className="dark:text-gray-300"
                />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Current Focus */}
          <motion.div
            className="space-y-4"
            variants={containerVariants}
          >
            <motion.h2
              className="text-2xl font-semibold tracking-tight dark:text-gray-100"
              variants={itemVariants}
            >
              Current Focus
            </motion.h2>
            <motion.p
              className="text-lg max-w-3xl leading-relaxed text-gray-600 dark:text-gray-300"
              variants={fadeInVariants}
            >
              Currently exploring cutting-edge blockchain protocols and developing
              decentralized applications that bridge the gap between Web2 and Web3 technologies.
              Passionate about building secure, scalable, and user-centric solutions that
              push the boundaries of what's possible in software engineering.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  )
}
