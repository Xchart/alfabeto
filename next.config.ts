import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/chispa" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/chispa/" : "",
};

export default nextConfig;
