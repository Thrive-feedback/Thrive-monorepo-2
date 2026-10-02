import 'server-only';
import { type ApiClient, createApiClient } from '@repo/api';

let client: ApiClient | undefined;

/**
 * Where this server reaches the API. Read on first use rather than at import, so a page that
 * never calls the API can still be built without `API_BASE_URL`.
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

/** The one API client this server holds. */
export function apiClient(): ApiClient {
  client ??= createApiClient({ baseUrl: apiBaseUrl() });
  return client;
}
