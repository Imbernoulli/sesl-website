import type { NextConfig } from "next";

// GitHub Pages serves project sites under /<repo>. Set NEXT_PUBLIC_BASE_PATH
// (set automatically by the deploy workflow) so internal links and the
// fetch('/data/state.json') call resolve correctly both locally and on Pages.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
