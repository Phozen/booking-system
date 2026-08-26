import type { NextConfig } from "next";

const longLivedAssetCache = [
  {
    key: "Cache-Control",
    value: "public, max-age=31536000, immutable",
  },
];

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [
      {
        source: "/:path*.png",
        headers: longLivedAssetCache,
      },
      {
        source: "/:path*.webp",
        headers: longLivedAssetCache,
      },
      {
        source: "/:path*.svg",
        headers: longLivedAssetCache,
      },
      {
        source: "/:path*.ico",
        headers: longLivedAssetCache,
      },
    ];
  },
};

export default nextConfig;
