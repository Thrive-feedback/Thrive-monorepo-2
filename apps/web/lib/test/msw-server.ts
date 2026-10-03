import { setupServer } from 'msw/node';

/**
 * The one network every suite runs against. Each test adds the handlers it needs with
 * `server.use()`; anything it did not expect fails the test instead of reaching a real host.
 */
export const server = setupServer();

/** Where the tests' API lives. `.test` is reserved, so it can never resolve to a real one. */
export const TEST_API_BASE_URL = 'http://api.test';
