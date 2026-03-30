import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions are enabled by default in Next.js 15
  experimental: {},

  images: {
    remotePatterns: [
      // Supabase Storage — populated via env at runtime
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
