import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw-server';

// Test globals are off, so Testing Library cannot register its own cleanup; without this,
// one test's rendered tree leaks into the next.
afterEach(() => {
  cleanup();
});

// The network is mocked here and nothing below it is, so the generated client, its
// middleware and the mapping all run for real. A request no handler expected fails the test
// instead of reaching a real server.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

// jsdom leaves out layout and pointer APIs that Radix and sonner call: the Select measures its
// trigger and captures the pointer, Checkbox and Switch watch their size, and a toast captures
// the pointer on press so it can be swiped away. These stand-ins do
// nothing, because jsdom has no layout for them to report.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
// Server-side suites run in the `node` environment, where there is no `Element` to patch.
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
}
