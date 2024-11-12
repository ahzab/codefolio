export default function Page() {
  return (
    <section className="flex items-center py-20">
      <div className="px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Abdel Ahzab
        </h1>

        {/* Contact Info */}
        <div className="flex items-center gap-4 mb-8">
          <a
            href="mailto:abdou.ahzab@gmail.com"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            abdou.ahzab@gmail.com
          </a>
        </div>

        {/* Tagline */}
        <div className="text-xl md:text-4xl font-semibold mb-8">
          <p className="mb-2">E-commerce Solutions Architect</p>
          <p>&amp; Blockchain developer</p>
        </div>

        {/* Description */}
        <div className="space-y-6">
          <p className="text-lg max-w-3xl leading-relaxed">
            Product-focused Full Stack Engineer with a proven track record in architecting
            human-centric e-commerce ecosystems and pioneering blockchain solutions.
            Specialized in crafting high-performance, user-friendly applications that
            bridge traditional commerce with Web3 technologies.
          </p>

          {/* Core Expertise */}
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold mb-4">Core Expertise:</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base">
              <li className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">▹</span>
                Full-stack development (React, TypeScript, Node.js, Kotlin, Rust)
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">▹</span>
                User-centered design and UX optimization
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">▹</span>
                Enterprise-grade e-commerce architecture
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">▹</span>
                Smart contract development
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">▹</span>
                Microservices architecture
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">▹</span>
                API design and security
              </li>
            </ul>
          </div>

          <p className="text-lg max-w-3xl leading-relaxed">
            Passionate about creating intuitive digital experiences that seamlessly
            blend innovative technology with user needs. Committed to delivering
            scalable solutions that drive business growth while ensuring optimal
            user satisfaction and engagement.
          </p>
        </div>
      </div>
    </section>
  )
}
