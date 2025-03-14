/**
 * Global setup for Vitest tests
 */

import { vi, beforeEach } from 'vitest';

// Модулі мокуються в фактичних файлах тестів
// Ми лише надаємо корисні хуки

// Reset all mocks after each test
beforeEach(() => {
  vi.resetAllMocks();

  // Встановлюємо дефолтні значення для мокування fs
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// Export helper functions for creating mock objects
export * from './__mocks__/documentHelperMocks';
export * from './__mocks__/setup';
