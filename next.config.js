/** @type {import('next').NextConfig} */
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // output: 'export', // Optional if we want a static PWA
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  experimental: {
    allowedOrigins: ['192.168.8.163', 'localhost', '127.0.0.1'],
  },
  allowedDevOrigins: ['192.168.8.163', 'localhost', '127.0.0.1'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/api/users/:path*', destination: 'http://127.0.0.1:4001/api/users/:path*' },
      { source: '/api/roles/:path*', destination: 'http://127.0.0.1:4001/api/roles/:path*' },
      { source: '/api/:path*', destination: 'http://127.0.0.1:4000/api/:path*' }
    ];
  },
};

export default withPWA(nextConfig);
