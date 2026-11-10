import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Backend media storage (profile photos, post media) — Cloudinary.
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Google sign-in avatars.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
