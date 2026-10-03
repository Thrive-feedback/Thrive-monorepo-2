/**
 * Where the web server reaches the API, from `API_BASE_URL`. Shared by the build, whose
 * callback rewrite is written with it, and by the generated client at run time, so the two
 * can never point at different places. A missing value stops whichever needs it, naming
 * the variable. Server-only by its nature: the browser talks to this app alone.
 */
export function apiBaseUrl(): string {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      'API_BASE_URL is not set. Copy apps/web/.env.example to apps/web/.env.',
    );
  }
  return baseUrl.replace(/\/$/, '');
}
