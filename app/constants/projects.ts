export interface Project {
  name: string;
  description: string;
  tech: string[];
  highlights: string[];
  image: string;
  url?: string;
}

export const projects: Project[] = [
  {
    name: "Blockchain Validation & Analytics Platform",
    description: "Developed a robust platform to monitor blockchain producer performance and validation metrics. The platform provides real-time results, producer-specific analytics, and interactive statistics with drill-down views. Users can analyze test metrics across chains and understand test methodologies through helper sections. The platform leverages serverless architecture for optimal scalability and performance.",
    tech: [
      "Next.js",
      "Node.js",
      "Tailwind CSS",
      "Recharts",
      "REST APIs",
      "Mainnet",
      "Testnet",
      "Serverless"
    ],
    highlights: [
      "Real-time blockchain monitoring",
      "Producer-specific analytics",
      "Interactive statistics dashboard",
      "Missing block tracking",
      "Cross-chain test metrics analysis",
      "Test methodology documentation"
    ],
    image: "/images/placeholder-image.png",
    url: "https://wax.sengine.co/"
  },
  {
    name: "Degen Markets",
    description: "A decentralized prediction market platform built on Solana blockchain, enabling users to create and participate in prediction markets with P2P betting capabilities. This full-stack dApp demonstrates modern Web3 development practices and seamless blockchain integration, featuring real-time market updates and dynamic data fetching. The platform emphasizes transparent and secure transactions with a user-friendly interface.",
    tech: [
      "Next.js 14",
      "TypeScript",
      "Solana",
      "TailwindCSS",
      "Solana Wallet Adapter",
      "Vercel"
    ],
    highlights: [
      "P2P betting system with automated settlement",
      "Real-time market price updates",
      "Secure wallet integration",
      "Responsive design for all devices",
      "User-friendly transaction management",
      "Dynamic market creation"
    ],
    image: "/images/placeholder-image.png",
    url: "https://degenmarkets.com"
  },
  {
    name: "Sentnl.io",
    description: "A modern, responsive web application built for a blockchain security audit company, featuring a clean and professional design that emphasizes trust and technical expertise. The platform includes dynamic audit report rendering, custom animations, and a comprehensive consultation booking system. The development prioritizes performance, security, and user experience while maintaining a professional aesthetic that aligns with the blockchain security industry.",
    tech: [
      "Next.js 14",
      "TailwindCSS",
      "React",
      "TypeScript",
      "Custom Animation Libraries"
    ],
    highlights: [
      "Interactive service cards showcasing audit types",
      "Dynamic audit report display system",
      "Real-time statistics dashboard",
      "Custom consultation booking system",
      "Cross-browser compatibility",
      "Professional security-focused design"
    ],
    image: "/images/placeholder-image.png",
    url: "https://sentnl.io"
  },
  {
    name: "HSE E-commerce Checkout Flow",
    description: "Contributed to the development and optimization of the checkout experience for HSE (Home Shopping Europe) as part of an agile development team. The project focused on modernizing the checkout flow and implementing robust analytics solutions. Key achievements include enhanced payment method integration, improved form validation, and comprehensive analytics tracking throughout the checkout funnel. The implementation leverages cloud services for optimal performance and scalability.",
    tech: [
      "React.js",
      "TypeScript",
      "Kotlin",
      "Spring Boot",
      "AWS Lambda",
      "DynamoDB",
      "CloudWatch",
      "S3",
      "CloudFront",
      "Amplitude",
      "Google Analytics 4"
    ],
    highlights: [
      "Enhanced payment method integration",
      "Real-time inventory checking",
      "Mobile checkout optimization",
      "Advanced analytics tracking",
      "A/B testing implementation",
      "Improved form validation"
    ],
    image: "/images/placeholder-image.png",
    url: "https://www.hse.com"
  },
  {
    name: "HSE Call Center Backoffice Application",
    description: "Contributed to developing a comprehensive backoffice application for HSE's call center operations, enabling customer service representatives to efficiently handle calls and process orders. The system features real-time customer data display, integrated telephony systems, and extensive analytics tracking. Implemented using serverless architecture and AWS services, the application significantly improved call handling times, order accuracy rates, and overall agent productivity.",
    tech: [
      "React.js",
      "TypeScript",
      "Kotlin",
      "Spring Boot",
      "AWS Lambda",
      "Amazon Connect",
      "DynamoDB",
      "API Gateway",
      "CloudWatch",
      "AWS Cognito",
      "Amplitude",
      "Google Analytics"
    ],
    highlights: [
      "Real-time customer information display",
      "Order creation and modification workflow",
      "Customer history and previous orders view",
      "Quick product search and recommendation tools",
      "Call logging and note-taking system",
      "Integration with inventory management system",
      "Custom analytics dashboards for performance metrics"
    ],
    image: "/images/placeholder-image.png",
  }
];
