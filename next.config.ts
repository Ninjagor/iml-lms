import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    outputFileTracingIncludes: {
        // This forces Vercel to bundle the Prisma engines for all pages/API routes
        "/": ["./src/generated/prisma/**/*.node"],
    },
};

export default nextConfig;
