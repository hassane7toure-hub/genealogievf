import type { NextConfig } from "next";
import { CLERK_JS_VERSION, CLERK_UI_VERSION } from "./lib/clerk-assets";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: `/npm/@clerk/clerk-js@${CLERK_JS_VERSION}/dist/:path*`,
        destination: `https://cdn.jsdelivr.net/npm/@clerk/clerk-js@${CLERK_JS_VERSION}/dist/:path*`,
      },
      {
        source: `/npm/@clerk/ui@${CLERK_UI_VERSION}/dist/:path*`,
        destination: `https://cdn.jsdelivr.net/npm/@clerk/ui@${CLERK_UI_VERSION}/dist/:path*`,
      },
    ];
  },
};

export default nextConfig;
