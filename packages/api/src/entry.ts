/**
 * GEN_07 R6 / INFRA_03 R5 — the package's only public surface. Everything reachable from
 * here is API; everything else is internal, including the generated module, which is
 * re-exported only as types.
 */

export { API_UNREACHABLE, ApiError } from './api-error';
export type { ApiClient, ApiClientConfig } from './client';
export { CORRELATION_ID_HEADER, createApiClient, unwrap } from './client';
export type { components, operations, paths } from './generated/schema';
