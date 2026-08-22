import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Institución and Candidatos forms can submit two 5 MB images at once.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
