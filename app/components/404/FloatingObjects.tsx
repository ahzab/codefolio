import { motion } from "framer-motion";

const FloatingObjects = () => {
  const objects = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    x: Math.random() * 200,
    y: Math.random() * 200,
    duration: Math.random() * 8 + 4
  }))

  return (
    <>
      {objects.map((obj) => (
        <motion.circle
          key={obj.id}
          cx={obj.x}
          cy={obj.y}
          r={obj.size}
          fill="currentColor"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [1, 1.5, 1],
            x: obj.x + Math.random() * 40 - 20,
            y: obj.y + Math.random() * 40 - 20
          }}
          transition={{
            duration: obj.duration,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-blue-400 dark:text-blue-500"
        />
      ))}
    </>
  )
}

export default FloatingObjects;
