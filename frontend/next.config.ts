import path from 'node:path';
import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

// ponytail: bundle analyzer only runs when ANALYZE=true to avoid slowing normal builds
const withAnalyzer = withBundleAnalyzer({ enabled: !!process.env.ANALYZE });

const nextConfig: NextConfig = {
  turbopack: {
    // Keep module resolution within this frontend, even when parent folders
    // contain unrelated lockfiles.
    root: path.resolve(__dirname),
  },
  images: {
    // ponytail: store assets are served from S3 via signed URLs; pin the real
    // bucket host(s) in production instead of the wildcard.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default process.env.ANALYZE ? withAnalyzer(nextConfig) : nextConfig;
