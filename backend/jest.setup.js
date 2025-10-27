// This file is executed before all tests.
// We can use it to set up a global test environment.

// Prevent the application from trying to connect to a real database during tests
jest.mock('./src/config/db', () => ({
  connectDB: jest.fn(),
}));
