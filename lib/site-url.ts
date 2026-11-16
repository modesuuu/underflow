/**
 * The public origin of this deployment, used wherever an
 * absolute URL is required (metadata, robots, sitemap).
 * Set NEXT_PUBLIC_SITE_URL in production; local development
 * falls back to the dev origin.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  return "http://localhost:3000";
}
