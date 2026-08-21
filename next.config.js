/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScript errors ki wajah se build fail nahi hoga
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
