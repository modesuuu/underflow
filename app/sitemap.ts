import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/** Public, indexable routes. App routes behind sign-in are not listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();
  const entry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  });
  return [
    entry("/", 1),
    entry("/collaborations", 0.8),
    entry("/signup", 0.7),
    entry("/login", 0.5),
    entry("/about", 0.5),
    entry("/terms", 0.3),
    entry("/privacy", 0.3),
    entry("/contact", 0.3),
  ];
}
