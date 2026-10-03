import 'server-only';
import { type ApiClient, createApiClient } from '@repo/api';
import { apiBaseUrl } from './api-base-url.util';

let client: ApiClient | undefined;

/** The one API client this server holds. */
export function apiClient(): ApiClient {
  client ??= createApiClient({ baseUrl: apiBaseUrl() });
  return client;
}
