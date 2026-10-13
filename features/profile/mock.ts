// features/profile/mock.ts
import { CURRENT_USER } from "@/components/layout/nav";
import type { PersonDetail } from "./types";

/**
 * Detail records for the people who already appear in the dashboard /
 * collaborations mocks. `id` is canonical (the post-author id when the
 * person has one); `aliases` collects the other features' ids for the
 * same human so any byline can link here and resolve.
 */
export const PEOPLE: PersonDetail[] = [
  {
    id: "user-russel",
    aliases: ["user-russel", "m-owner"],
    name: "Russel",
    role: "Owner • Fullstack",
    bio: "Fullstack dev who likes turning campus ideas into working products.",
    email: "russel@hotmail.com",
    socials: [
      { label: "Instagram", icon: "instagram" },
      { label: "LinkedIn", icon: "linkedin" },
      { label: "GitHub", icon: "github" },
    ],
    skills: [
      { id: "user-russel-sk1", label: "Coding", icon: "code-alt" },
      { id: "user-russel-sk2", label: "Backend", icon: "server" },
      { id: "user-russel-sk3", label: "UI Design", icon: "palette" },
      { id: "user-russel-sk4", label: "Testing", icon: "bug" },
      { id: "user-russel-sk5", label: "DevOps", icon: "terminal" },
    ],
  },
  {
    id: "user-silena",
    aliases: ["user-silena"],
    name: "Silena",
    bio: "Photography and design enthusiast; usually behind the camera.",
    email: "silena@gmail.com",
    socials: [{ label: "Instagram", icon: "instagram" }],
    skills: [
      { id: "user-silena-sk1", label: "UI Design", icon: "palette" },
      { id: "user-silena-sk2", label: "Writing", icon: "pencil" },
    ],
  },
  {
    id: "user-olya",
    aliases: ["user-olya"],
    name: "Olya",
    bio: "Zine maker and frontend tinkerer.",
    email: "olya@gmail.com",
    socials: [
      { label: "Instagram", icon: "instagram" },
      { label: "GitHub", icon: "github" },
    ],
    skills: [
      { id: "user-olya-sk1", label: "Coding", icon: "code-alt" },
      { id: "user-olya-sk2", label: "UI Design", icon: "palette" },
    ],
  },
  {
    id: "user-davis",
    aliases: ["user-davis"],
    name: "Davis",
    bio: "Hackathon regular. Ships fast, sleeps later.",
    email: "davis@gmail.com",
    socials: [
      { label: "LinkedIn", icon: "linkedin" },
      { label: "GitHub", icon: "github" },
    ],
    skills: [
      { id: "user-davis-sk1", label: "Coding", icon: "code-alt" },
      { id: "user-davis-sk2", label: "Mobile", icon: "mobile-alt" },
    ],
  },
  {
    id: "m-kimi",
    aliases: ["m-kimi"],
    name: "Kimi",
    role: "UI Designer",
    bio: "UI designer who sweats the spacing scale.",
    email: "kimi@gmail.com",
    socials: [
      { label: "Instagram", icon: "instagram" },
      { label: "LinkedIn", icon: "linkedin" },
    ],
    skills: [
      { id: "m-kimi-sk1", label: "UI Design", icon: "palette" },
      { id: "m-kimi-sk2", label: "Coding", icon: "code-alt" },
    ],
  },
  {
    id: "m-alex",
    aliases: ["m-alex"],
    name: "Alex",
    role: "Backend Dev",
    bio: "Backend dev; APIs, auth, and the occasional schema argument.",
    email: "alex@gmail.com",
    socials: [{ label: "GitHub", icon: "github" }],
    skills: [
      { id: "m-alex-sk1", label: "Backend", icon: "server" },
      { id: "m-alex-sk2", label: "Data", icon: "bar-chart-alt-2" },
    ],
  },
  {
    id: "m-jenny",
    aliases: ["m-jenny"],
    name: "Jenny",
    role: "ML Engineer",
    bio: "ML engineer training small models on smaller datasets.",
    email: "jenny@gmail.com",
    socials: [
      { label: "LinkedIn", icon: "linkedin" },
      { label: "GitHub", icon: "github" },
    ],
    skills: [
      { id: "m-jenny-sk1", label: "Data", icon: "bar-chart-alt-2" },
      { id: "m-jenny-sk2", label: "Coding", icon: "code-alt" },
    ],
  },
  {
    // The signed-in user. The id matches the author id the comment
    // composer already fabricates for the current user ("me").
    id: "me",
    aliases: ["me"],
    name: CURRENT_USER.name,
    bio: "Building Bareng, one project at a time.",
    email: CURRENT_USER.email,
    socials: [
      { label: "Instagram", icon: "instagram" },
      { label: "GitHub", icon: "github" },
    ],
    skills: [
      { id: "me-sk1", label: "Coding", icon: "code-alt" },
      { id: "me-sk2", label: "UI Design", icon: "palette" },
      { id: "me-sk3", label: "Backend", icon: "server" },
    ],
  },
];

/**
 * Sync alias → canonical-id lookup (client-safe: this module is data
 * only). Bylines become profile links only when this resolves — generic
 * mock commenters ("user-1", …) have no profile and stay plain text.
 */
export function resolvePersonId(id: string): string | undefined {
  return PEOPLE.find((p) => p.id === id || p.aliases.includes(id))?.id;
}
