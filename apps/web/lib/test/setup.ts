import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Test globals are off, so Testing Library cannot register its own cleanup; without this,
// one test's rendered tree leaks into the next.
//
// No network is mocked because nothing the web app renders reads it yet. The first suite
// that does belongs here with MSW and `onUnhandledRequest: 'error'`, so an unmocked request
// fails the test instead of reaching a real server.
afterEach(() => {
  cleanup();
});
