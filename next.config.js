/** @type {import('next').NextConfig} */
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const AUTH_API_BASE = 'https://auth.besheger.com';
const MAIN_API_BASE = 'https://milkitest.besheger.com';

// const AUTH_API_BASE = 'http://localhost:4001';
// const MAIN_API_BASE = 'http://localhost:4000';

const nextConfig = {
  // output: 'standalone', // Only enable for Docker/containerized deployments
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  env: {
    AUTH_API_BASE,
    MAIN_API_BASE,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },

  async rewrites() {
    const AUTH_API_URL = `${AUTH_API_BASE}/api`;
    const MAIN_API_URL = `${MAIN_API_BASE}/api`;

    return [
      { source: '/api/users', destination: `${AUTH_API_URL}/users` },
      { source: '/api/users/:path*', destination: `${AUTH_API_URL}/users/:path*` },
      { source: '/api/:path*', destination: `${MAIN_API_URL}/:path*` }
    ];
  },
};

export default withPWA(nextConfig);
