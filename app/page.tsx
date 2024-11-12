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
        <h1 className="text-5xl font-bold mb-4">
          <GradientText>Abdel Ahzab</GradientText>
        </h1>

        <div className="flex flex-wrap items-center gap-4 mb-8">
          <ContactLink
            href="mailto:abdou.ahzab@gmail.com"
            icon={<EmailIcon />}
            text="abdou.ahzab@gmail.com"
          />
          <ContactLink
            href="https://github.com/yourusername"
            icon={<GithubIcon />}
            text="GitHub"
            className="text-gray-700 hover:text-gray-900"
          />
        </div>

        <div className="text-xl md:text-4xl font-semibold mb-8">
          <p className="mb-2">Full Stack Engineer</p>
          <GradientText>&amp; Blockchain Developer</GradientText>
        </div>

        <div className="space-y-8">
          <p className="text-lg max-w-3xl leading-relaxed">
            Passionate Full Stack Engineer with 9+ years of experience building innovative
            digital solutions. Specializing in scalable web applications, distributed systems,
            and blockchain technology. I combine technical expertise with a strong product mindset
            to deliver impactful solutions that drive business value.
          </p>

          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold mb-6">Core Expertise</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkillsList title="Technical Skills" skills={technicalSkills} />
              <SkillsList title="Specialized Focus" skills={specializedSkills} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Current Focus</h2>
            <p className="text-lg max-w-3xl leading-relaxed">
              Currently exploring cutting-edge blockchain protocols and developing
              decentralized applications that bridge the gap between Web2 and Web3 technologies.
              Passionate about building secure, scalable, and user-centric solutions that
              push the boundaries of what's possible in software engineering.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
