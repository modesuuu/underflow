import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * TODO(contract): add `images.remotePatterns` for the upload storage/CDN
   * host once the backend team answers open question #2 in
   * docs/api-contract.md (image storage/CDN). Until then, upload-derived
   * images are rendered with plain <img> — next/image is intentionally not
   * configured, and adding remotePatterns with a guessed host is worse
   * than documenting the blocker.
   */
};

export default nextConfig;
