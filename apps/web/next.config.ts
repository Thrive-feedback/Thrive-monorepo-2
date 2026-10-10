import { join } from 'node:path';
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
  // The deployed image ships a traced server and its own dependencies, rather than the
  // whole workspace. Without this the runtime image carries every development dependency
  // in the monorepo, for a server that needs a fraction of them.
  output: 'standalone',
  // Traced from the repository root: a workspace app's dependencies are installed above
  // its own directory, and the trace must be able to reach them.
  outputFileTracingRoot: join(import.meta.dirname, '../..'),
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
