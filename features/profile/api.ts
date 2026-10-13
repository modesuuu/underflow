// features/profile/api.ts
import { ApiEnvelope, apiFetch, ApiError, isApiConfigured } from "@/lib/api-client";
import { getCollabProjects } from "@/features/collaborations/api";
import { getDashboardPosts } from "@/features/dashboard/api";
import { getMyCollabProjects } from "@/features/my-collaborations/api";
import { PEOPLE } from "./mock";
import type { PersonDetail, ProfileStats } from "./types";

// TODO(backend): replace with GET /api/users/:id (contract envelope
// `{ data, meta }` — typed so the mock→fetch swap cannot change call sites).
// The mock resolves ANY known alias to the canonical person, because the
// feature mocks still give the same human different ids per feature.
export async function getPerson(id: string): Promise<PersonDetail | undefined> {
  if (isApiConfigured()) {
    try {
      const res = await apiFetch<ApiEnvelope<PersonDetail>>(`/api/users/${id}`);
      return res.data;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined;
      throw err;
    }
  }
  return PEOPLE.find((p) => p.id === id || p.aliases.includes(id));
}

/**
 * The Performance Summary figures are COMPUTED from the existing mocks —
 * never typed by hand (the Figma frame's 55 / 21 / 321 are placeholders):
 * - Post Feed: dashboard posts authored under any of the person's ids.
 * - Projects: for the current user, their own board data is the truth
 *   (my-collaborations, split on myStatus); for everyone else, filled
 *   membership in the public projects, split on the project status.
 * TODO(backend): replace with GET /api/users/:id/stats.
 */
export async function getProfileStats(person: PersonDetail): Promise<ProfileStats> {
  const posts = await getDashboardPosts();
  const postFeed = posts.filter((post) =>
    person.aliases.includes(post.author.id),
  ).length;

  if (person.id === "me") {
    const mine = await getMyCollabProjects();
    const completeProjects = mine.filter((p) => p.myStatus === "complete").length;
    return {
      completeProjects,
      postFeed,
      activeProjects: mine.length - completeProjects,
    };
  }

  const projects = await getCollabProjects();
  const memberships = projects.filter((project) =>
    project.members.some(
      (member) => !member.isOpenSlot && person.aliases.includes(member.id),
    ),
  );
  const completeProjects = memberships.filter(
    (p) => p.status === "completed",
  ).length;
  return {
    completeProjects,
    postFeed,
    activeProjects: memberships.length - completeProjects,
  };
}
