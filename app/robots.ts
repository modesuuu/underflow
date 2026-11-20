import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Crawlers may index the public surface only. Everything
 * behind sign-in (the app itself, settings, admin) stays out
 * of search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/signup",
          "/terms",
          "/privacy",
          "/about",
          "/contact",
          "/collaborations",
        ],
        disallow: [
          "/admin",
          "/settings",
          "/inbox",
          "/my-collaborations",
          "/circle",
          "/dashboard",
          "/notifications",
          "/profile",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
