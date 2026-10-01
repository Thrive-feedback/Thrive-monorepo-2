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
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};
