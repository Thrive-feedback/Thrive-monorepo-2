import type { NextConfig } from 'next';
import { apiBaseUrl } from './lib/api-base-url.util';

/**
 * The browser only ever talks to this app (ADR 0027). Google's sign-in callback is the one
 * request it sends that the API must answer, so this forwards exactly that path and nothing
 * else; every other API call goes through the generated client from the server.
 *
 * The destination is written into the build, so a missing `API_BASE_URL` fails the build
 * rather than shipping a callback that goes nowhere.
 */
const nextConfig: NextConfig = {
  allowedDevOrigins: ['http://localhost:3000'],
  async rewrites() {
    return [
      {
        source: '/api/auth/callback/:path*',
        destination: `${apiBaseUrl()}/api/auth/callback/:path*`,
      },
    ];
  },
};

export default nextConfig;
