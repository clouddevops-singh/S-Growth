export type Habit = { id: string; name: string; active: boolean };
export type Goal = { id: string; title: string; icon: string; progress: number; deadline: string };
export type Skill = { id: string; name: string; score: number };
export type SkillGroups = Record<string, Skill[]>;

export type GrowthState = {
  version: 1;
  habits: Habit[];
  completions: Record<string, string[]>;
  goals: Goal[];
  skills: SkillGroups;
  profile: { name: string; headline: string; about: string };
  vision: Record<string, string>;
  theme: "dark" | "light";
  photoKey: string | null;
};

const skillGroups: Record<string, [string, number][]> = {
  technical: [
    ["Python / Data Engineering", 75], ["SQL & Databases", 70], ["Web Development", 65],
    ["System Design", 55], ["APIs & Integrations", 72], ["Linux", 78],
  ],
  devops: [
    ["Kubernetes", 70], ["Docker", 80], ["AWS", 65], ["Azure", 55], ["GCP", 50],
    ["DigitalOcean", 68], ["Hetzner", 60], ["GitHub Actions", 75], ["Jenkins", 65],
    ["Prometheus & Grafana", 70], ["Datadog", 60], ["Databases (Postgres / MySQL / Redis)", 72],
  ],
  mental: [["Focus & Deep Work",80],["Emotional Intelligence",70],["Resilience",75],["Mindfulness",65],["Critical Thinking",78],["Learning Speed",82]],
  problemsolving: [["Analytical Thinking",85],["Debugging & Root Cause Analysis",80],["System Troubleshooting",78],["Algorithms & Data Structures",70],["Creative Problem Solving",75],["Decision Making Under Pressure",72]],
  business: [["Marketing",60],["Sales",55],["Public Speaking",50],["Negotiation",58],["Stakeholder Communication",70],["Strategic Thinking",65]],
  physical: [["Overall Fitness",60],["Endurance",55],["Sleep Quality",70],["Nutrition",65],["Strength",50],["Energy Levels",72]],
};

export function defaultState(): GrowthState {
  const names = [
    "Complete assignments", "Read 10 pages of a book", "Exercise for 30 minutes", "Drink 8 glasses of water",
    "Plan next day's schedule", "Meditate for 10 minutes", "Check emails and updates", "Practice language skills",
    "Write in a journal", "Solve 3 practice problems", "Watch an educational video", "Update to-do list",
    "Take a 15-minute walk", "Get at least 7 hours of sleep", "Organize digital files", "Organize study desk",
  ];
  return {
    version: 1,
    habits: names.map((name) => ({ id: crypto.randomUUID(), name, active: true })),
    completions: {},
    goals: [
      { icon: "🏋️", title: "Exercise every day for 90 days", progress: 35, deadline: "Sep 2026" },
      { icon: "📚", title: "Read 12 books this year", progress: 50, deadline: "Dec 2026" },
      { icon: "🧘", title: "Meditate 10 min daily — no breaks", progress: 60, deadline: "Dec 2026" },
      { icon: "☸️", title: "Pass CKA certification", progress: 20, deadline: "Oct 2026" },
      { icon: "✍️", title: "Journal every single day", progress: 75, deadline: "Dec 2026" },
      { icon: "🗣️", title: "Public speaking — give 3 talks", progress: 15, deadline: "Dec 2026" },
    ].map((goal) => ({ ...goal, id: crypto.randomUUID() })),
    skills: Object.fromEntries(Object.entries(skillGroups).map(([group, values]) => [
      group, values.map(([name, score]) => ({ id: crypto.randomUUID(), name: String(name), score: Number(score) })),
    ])),
    profile: {
      name: "MR Sisodiya",
      headline: "Cloud & DevOps Engineer · Daily Habit Builder · Lifelong Learner",
      about: "I believe growth is a system, not a wish. I build habits with intention, monitor my progress, and keep improving. This dashboard brings daily practice, skills, and longer-term goals together so I can focus on the next useful step. My interests include cloud-native infrastructure, Kubernetes, continuous learning, and finding steady ways to become more focused and intentional.",
    },
    vision: {
      career: "Lead cloud-native infrastructure at scale. Build resilient systems and keep learning.",
      personal: "Become a more disciplined, clear-minded version of myself through consistent habits.",
      financial: "Build financial independence through valuable skills, thoughtful choices, and steady progress.",
      business: "Build strong communication skills, speak with confidence, and bridge technical and business work.",
    },
    theme: "dark",
    photoKey: null,
  };
}

export function validState(value: unknown): value is GrowthState {
  if (!value || typeof value !== "object") return false;
  const state = value as GrowthState;
  return state.version === 1 && Array.isArray(state.habits) && Array.isArray(state.goals)
    && state.completions && typeof state.completions === "object"
    && state.skills && typeof state.skills === "object"
    && state.profile && typeof state.profile.name === "string" && typeof state.profile.headline === "string"
    && typeof state.profile.about === "string" && state.profile.name.length <= 100
    && state.profile.headline.length <= 200 && state.profile.about.length <= 3000
    && state.vision && typeof state.vision === "object"
    && ["dark", "light"].includes(state.theme)
    && (state.photoKey === null || typeof state.photoKey === "string")
    && JSON.stringify(value).length < 1_000_000;
}
