/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Dev server is proxied through a preview host (e.g. *.e2b.app / *.vercel.app).
  // Allow those origins so HMR + server actions work behind the proxy.
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '*.e2b.app',
    '*.vercel.app',
    '*.webora.app',
  ],
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Keep the editor snappy: these are all first-party modules.
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
