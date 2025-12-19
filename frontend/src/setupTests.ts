import '@testing-library/jest-dom';
import { beforeAll } from 'vitest';

// Suppress console errors during tests (network errors are expected)
beforeAll(() => {
  const originalError = console.error;
  const originalWarn = console.warn;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.error = (...args: any[]) => {
    // Suppress network-related errors during tests
    const msg = args[0]?.toString() || '';
    if (
      msg.includes('AggregateError') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('Network Error') ||
      msg.includes('connect ECONNREFUSED')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.warn = (...args: any[]) => {
    // Suppress network-related warnings during tests
    const msg = args[0]?.toString() || '';
    if (msg.includes('AggregateError') || msg.includes('ECONNREFUSED')) {
      return;
    }
    originalWarn.apply(console, args);
  };
});
