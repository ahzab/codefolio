# Codefolio - Modern Developer Portfolio

A modern, responsive portfolio website built with Next.js, TypeScript, and Tailwind CSS. Showcasing my journey as a Full Stack Engineer & Blockchain Developer with 9+ years of experience.

Live Demo: [codefolio.dev](https://www.codefolio.dev/)


## 🚀 Features

- **Responsive Design**: Fully responsive layout that works seamlessly across all devices
- **Modern Stack**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Component-Based Architecture**: Modular and reusable components
- **Performance Optimized**: Following Next.js best practices for optimal performance
- **Type-Safe**: Fully typed with TypeScript for robust development

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React](https://reactjs.org/)

## 🏗️ Project Structure

```
├── app/
│   └── page.tsx              # Main portfolio page
├── components/
│   ├── ContactLink.tsx       # Reusable contact link component
│   ├── GradientText.tsx     # Gradient text effect component
│   ├── SkillsList.tsx       # Skills list component
│   └── icons/               # SVG icons components
│       ├── EmailIcon.tsx
│       └── GithubIcon.tsx
├── public/                   # Static assets
└── styles/                   # Global styles
```

## 🚦 Getting Started

1. **Clone the repository**
```bash
git clone https://github.com/ahzab/codefolio.git
cd codefolio
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. **Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.**

## 🔧 Configuration

To customize the portfolio for your own use:

1. Update personal information in `app/page.tsx`
2. Modify skills lists in the technical and specialized sections
3. Replace social links with your own
4. Update the current focus section with your interests

## 📝 Making Changes

### Adding New Skills

```typescript
const technicalSkills = [
  'Full-stack Development (React, TypeScript, Node.js)',
  'Systems Programming (Rust, Kotlin)',
  'Cloud & DevOps (AWS, Docker, Kubernetes)',
  // Add your skills here
];
```

### Updating Contact Information

```typescript
<ContactLink
  href="mailto:abdou.ahzab@gmail.com"
  icon={<EmailIcon />}
  text="abdou.ahzab@gmail.com"
/>
```

## 🎨 Styling

This project uses Tailwind CSS for styling. The main style configurations can be found in:

- `tailwind.config.js`: Tailwind configuration
- `globals.css`: Global styles

## 📱 Responsive Design

The portfolio is responsive across various breakpoints:

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## 👥 Contact

Abdel Ahzab
- Email: [abdou.ahzab@gmail.com](mailto:abdou.ahzab@gmail.com)
- GitHub: [@ahzab](https://github.com/ahzab)
- Website: [codefolio.dev](https://www.codefolio.dev/)

Project Link: [https://github.com/ahzab/codefolio](https://github.com/ahzab/codefolio)

## 🙏 Acknowledgments

* [Next.js Documentation](https://nextjs.org/docs)
* [Tailwind CSS Documentation](https://tailwindcss.com/docs)
* [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

Built with ❤️ by [Abdel Ahzab](https://github.com/ahzab)
