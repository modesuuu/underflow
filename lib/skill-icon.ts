/**
 * Boxicons glyph for a skill chip, matched from the skill's name.
 * Skills are user-created with free-form names, so matching is
 * keyword based: the name is split into words and the first rule
 * with a matching word wins ("front-end" also matches via its
 * joined form). Unknown names fall back to a plain tag glyph
 * instead of a code icon, which reads wrong for non-technical
 * skills. Rule order matters: specific domains come before the
 * generic coding bucket.
 */
const RULES: { icon: string; words: string[] }[] = [
  { icon: "video", words: ["video", "motion", "film", "editing"] },
  {
    icon: "pen-tool",
    words: ["ui", "ux", "figma", "design", "desain", "grafis", "graphic", "graphics"],
  },
  { icon: "cloud", words: ["devops"] },
  { icon: "server", words: ["backend", "server", "api"] },
  { icon: "code-alt", words: ["frontend"] },
  {
    icon: "data",
    words: ["data", "database", "sql", "analytics", "analyst", "basis"],
  },
  {
    icon: "pen",
    words: ["writing", "writer", "content", "copywriting", "menulis", "penulis", "editor"],
  },
  {
    icon: "briefcase",
    words: ["manager", "management", "manajer", "leadership", "lead"],
  },
  {
    icon: "support",
    words: ["assisten", "assistant", "asisten", "support", "admin"],
  },
  {
    icon: "megaphone",
    words: ["marketing", "social", "sosial", "seo", "promotion", "promosi"],
  },
  {
    icon: "camera",
    words: ["photo", "photography", "fotografi", "camera", "foto"],
  },
  { icon: "music", words: ["music", "musik", "audio", "sound"] },
  { icon: "search-alt", words: ["research", "riset", "penelitian"] },
  { icon: "shield", words: ["security", "cyber", "cybersecurity", "keamanan"] },
  { icon: "network-chart", words: ["network", "jaringan", "networking"] },
  {
    icon: "wallet",
    words: ["finance", "keuangan", "accounting", "akuntansi", "financial"],
  },
  { icon: "bot", words: ["ai", "ml", "machine"] },
  {
    icon: "code-curly",
    words: [
      "coding", "code", "programming", "programmer", "developer", "dev",
      "software", "web", "mobile", "android", "ios", "fullstack",
      "flutter", "react", "laravel", "python", "javascript", "typescript",
    ],
  },
];

export function skillIconName(skillName: string): string {
  const words = skillName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const joined = words.join("");
  for (const rule of RULES) {
    if (rule.words.some((w) => words.includes(w) || joined === w)) {
      return rule.icon;
    }
  }
  return "tag";
}
