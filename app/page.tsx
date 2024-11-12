import { ContactLink } from "./components/ContactLink";
import { GradientText } from "./components/GradientText";
import { EmailIcon } from "./components/icons/EmailIcon";
import { GithubIcon } from "./components/icons/GithubIcon";
import { SkillsList } from "./components/SkillsList";
import { technicalSkills, specializedSkills } from "./constants";

export default function Page() {
  return (
    <section className="flex items-center py-20">
      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
          <GradientText>Abdel Ahzab</GradientText>
        </h1>

        {/* Contact Links */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <ContactLink
            href="mailto:abdou.ahzab@gmail.com"
            icon={<EmailIcon />}
            text="abdou.ahzab@gmail.com"
            aria-label="Email Abdel Ahzab"
          />
          <ContactLink
            href="https://github.com/ahzab"
            icon={<GithubIcon />}
            text="GitHub"
            className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            aria-label="Visit GitHub profile"
          />
        </div>

        {/* Role */}
        <div className="text-xl md:text-4xl font-semibold mb-8 tracking-tight">
          <p className="mb-2 dark:text-gray-100">Full Stack Engineer</p>
          <GradientText>&amp; Blockchain Developer</GradientText>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Bio */}
          <p className="text-lg max-w-3xl leading-relaxed text-gray-600 dark:text-gray-300">
            Passionate Full Stack Engineer with 9+ years of experience building innovative
            digital solutions. Specializing in scalable web applications, distributed systems,
            and blockchain technology. I combine technical expertise with a strong product mindset
            to deliver impactful solutions that drive business value.
          </p>

          {/* Expertise */}
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold mb-6 tracking-tight dark:text-gray-100">
              Core Expertise
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkillsList
                title="Technical Skills"
                skills={technicalSkills}
                className="dark:text-gray-300"
              />
              <SkillsList
                title="Specialized Focus"
                skills={specializedSkills}
                className="dark:text-gray-300"
              />
            </div>
          </div>

          {/* Current Focus */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight dark:text-gray-100">
              Current Focus
            </h2>
            <p className="text-lg max-w-3xl leading-relaxed text-gray-600 dark:text-gray-300">
              Currently exploring cutting-edge blockchain protocols and developing
              decentralized applications that bridge the gap between Web2 and Web3 technologies.
              Passionate about building secure, scalable, and user-centric solutions that
              push the boundaries of what's possible in software engineering.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
