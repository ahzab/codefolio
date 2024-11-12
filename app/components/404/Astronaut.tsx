import { motion } from "framer-motion";

const Astronaut = () => (
  <motion.svg
    viewBox="0 0 500 500"
    className="w-80 h-80"
    initial={{ rotate: 0 }}
    animate={{
      rotate: [0, 5, -5, 0],
      y: [0, -10, 0]
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    {/* Space background elements */}
    <circle cx="250" cy="250" r="150" fill="none" stroke="#E2E8F0" strokeWidth="1" />

    {/* Astronaut suit */}
    <motion.g
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Helmet */}
      <path
        d="M200 220 C200 180, 300 180, 300 220"
        fill="#ffffff"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M200 220 L200 320 C200 350, 300 350, 300 320 L300 220"
        fill="#ffffff"
        stroke="currentColor"
        strokeWidth="3"
      />

      {/* Helmet Visor */}
      <path
        d="M210 200 C210 180, 290 180, 290 200"
        fill="#4299E1"
        opacity="0.3"
      />

      {/* Body */}
      <path
        d="M200 320 L190 400 L310 400 L300 320"
        fill="#ffffff"
        stroke="currentColor"
        strokeWidth="3"
      />

      {/* Arms */}
      <motion.path
        d="M200 250 C150 250, 150 300, 160 320"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        animate={{
          d: [
            "M200 250 C150 250, 150 300, 160 320",
            "M200 250 C160 260, 150 290, 160 320",
            "M200 250 C150 250, 150 300, 160 320"
          ]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.path
        d="M300 250 C350 250, 350 300, 340 320"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        animate={{
          d: [
            "M300 250 C350 250, 350 300, 340 320",
            "M300 250 C340 260, 350 290, 340 320",
            "M300 250 C350 250, 350 300, 340 320"
          ]
        }}
        transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
      />

      {/* Backpack */}
      <rect
        x="220"
        y="260"
        width="60"
        height="80"
        fill="#ffffff"
        stroke="currentColor"
        strokeWidth="3"
      />

      {/* Oxygen tube */}
      <motion.path
        d="M220 280 C180 260, 160 300, 180 320"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="5,5"
        animate={{
          d: [
            "M220 280 C180 260, 160 300, 180 320",
            "M220 280 C190 270, 170 290, 180 320",
            "M220 280 C180 260, 160 300, 180 320"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.g>
  </motion.svg>
)

export default Astronaut;
