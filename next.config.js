/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Ignore build errors from face-api.js (browser-only library)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  eslint: {
    // Only run ESLint on specific directories during production builds
    dirs: ['app', 'components', 'lib', 'hooks'],
  },
}

module.exports = nextConfig
