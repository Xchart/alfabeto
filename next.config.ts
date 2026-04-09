import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/alfabeto" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/alfabeto/" : "",
};

export default nextConfig;
