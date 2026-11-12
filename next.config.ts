import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["100.121.159.106", "10.61.4.201"],
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
