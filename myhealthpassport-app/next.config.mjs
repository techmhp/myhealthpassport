import withPWA from 'next-pwa';
/** @type {import('next').NextConfig} */

const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

const nextConfig = {
  reactStrictMode: true, // Enable React strict mode for improved error handling
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during CI builds (lint separately)
  },
  typescript: {
    ignoreBuildErrors: true, // Skip TS errors during CI builds
  },
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload', // Fixed max-age to 1 year
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'same-origin',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, HEAD', // Block OPTIONS requests
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Authorization, Content-Type',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'false',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate', // Restrictive cache policy
          },
          {
            key: 'Expires',
            value: '0', // Explicitly disable caching
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none', // Added header to block cross-domain policy files
          },
        ],
      },
    ];
  },
  // swcMinify: true,            // Enable SWC minification for improved performance
  compiler: {
    removeConsole: process.env.NODE_ENV !== 'development',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.w3.org',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'myhealth-passport.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'placeholder.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'checkout.razorpay.com',
      },
    ],
  },
};

export default withPWA({
  dest: 'public', // destination directory for the PWA files
  disable: process.env.NODE_ENV === 'development', // disable PWA in the development environment
  register: true, // register the PWA service worker
  skipWaiting: true, // skip waiting for service worker activation
})(nextConfig);
