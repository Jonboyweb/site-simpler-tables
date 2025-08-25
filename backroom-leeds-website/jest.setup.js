import '@testing-library/jest-dom';

// Customized console logging for tests
const originalConsoleError = console.error;
console.error = (message, ...args) => {
  // Skip known warning messages
  if (
    !message.includes('Warning: An update inside a test was not wrapped in act') &&
    !message.includes('act(...)')
  ) {
    originalConsoleError(message, ...args);
  }
};

// Global test setup configurations
global.fetch = require('jest-fetch-mock');
global.fetch.enableMocks();