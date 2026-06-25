import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/stock-monitor",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
