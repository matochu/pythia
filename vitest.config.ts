/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    deps: {
      inline: ['**/*/node_modules/**']
    },
    includeSource: ['tools/**/*.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/tests/**', '**/__mocks__/**']
    }
  }
});
