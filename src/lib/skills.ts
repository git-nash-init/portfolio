export type Skill = { name: string; icon: string; category: SkillCategory };

export type SkillCategory =
  | "Languages"
  | "Frontend"
  | "Styling"
  | "Backend"
  | "Databases"
  | "AI & Data"
  | "Cloud"
  | "DevOps";

const dev = (slug: string, variant = "original") =>
  `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-${variant}.svg`;
const si = (slug: string) => `https://cdn.simpleicons.org/${slug}`;

export const SKILLS: Skill[] = [
  { category: "Languages", name: "TypeScript", icon: dev("typescript") },
  { category: "Languages", name: "JavaScript", icon: dev("javascript") },
  { category: "Languages", name: "Python", icon: dev("python") },
  { category: "Languages", name: "C++", icon: dev("cplusplus") },
  { category: "Languages", name: "SQL", icon: dev("azuresqldatabase") },

  { category: "Frontend", name: "Next.js", icon: dev("nextjs") },
  { category: "Frontend", name: "React", icon: dev("react") },
  { category: "Frontend", name: "Vite", icon: dev("vitejs") },
  { category: "Frontend", name: "Framer Motion", icon: dev("framermotion") },
  { category: "Frontend", name: "GSAP", icon: si("gsap") },

  { category: "Styling", name: "HTML5", icon: dev("html5") },
  { category: "Styling", name: "CSS3", icon: dev("css3") },
  { category: "Styling", name: "Tailwind", icon: dev("tailwindcss") },
  { category: "Styling", name: "shadcn/ui", icon: si("shadcnui") },

  { category: "Backend", name: "Node.js", icon: dev("nodejs") },
  { category: "Backend", name: "Express", icon: dev("express") },
  { category: "Backend", name: "Supabase", icon: dev("supabase") },
  { category: "Backend", name: "Firebase", icon: dev("firebase", "plain") },

  { category: "Databases", name: "PostgreSQL", icon: dev("postgresql") },
  { category: "Databases", name: "MySQL", icon: dev("mysql") },
  { category: "Databases", name: "Firestore", icon: dev("firebase", "plain") },

  { category: "AI & Data", name: "Pandas", icon: dev("pandas") },
  { category: "AI & Data", name: "NumPy", icon: dev("numpy") },
  { category: "AI & Data", name: "scikit-learn", icon: dev("scikitlearn") },
  { category: "AI & Data", name: "Jupyter", icon: dev("jupyter") },
  { category: "AI & Data", name: "LLM Integration", icon: si("anthropic/f4efe8") },

  { category: "Cloud", name: "Vercel", icon: dev("vercel") },
  { category: "Cloud", name: "Google Cloud", icon: dev("googlecloud") },
  { category: "Cloud", name: "Razorpay", icon: si("razorpay") },
  { category: "Cloud", name: "Netlify", icon: dev("netlify") },

  { category: "DevOps", name: "Git", icon: dev("git") },
  { category: "DevOps", name: "GitHub", icon: dev("github") },
  { category: "DevOps", name: "GitHub Actions", icon: dev("githubactions") },
  { category: "DevOps", name: "npm", icon: dev("npm", "original-wordmark") },
  { category: "DevOps", name: "VS Code", icon: dev("vscode") },
  { category: "DevOps", name: "Postman", icon: si("postman") },
  { category: "DevOps", name: "Windows", icon: dev("windows11") },
];

export const CATEGORIES: SkillCategory[] = [
  "Languages",
  "Frontend",
  "Styling",
  "Backend",
  "Databases",
  "AI & Data",
  "Cloud",
  "DevOps",
];
