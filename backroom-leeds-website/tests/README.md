# The Backroom Leeds - Testing Infrastructure

## Overview
This test suite provides comprehensive coverage for the Backroom Leeds admin dashboard, focusing on user management, booking systems, and role-based access control.

## Testing Strategy
- **Framework**: Jest with React Testing Library
- **Mocking**: MSW (Mock Service Worker)
- **Coverage Goal**: 85%+ across components
- **Focus Areas**: 
  - User Interface Rendering
  - Data Handling
  - Role-Based Access Control
  - Error Scenarios
  - Performance Testing

## Key Test Directories
- `super-admin/`: Super Admin dashboard tests
- `manager/`: Manager dashboard tests
- `door-staff/`: Door Staff dashboard tests
- `shared/`: Cross-cutting concerns and shared functionality
- `integration/`: End-to-end workflow tests
- `mocks/`: API request/response mocking

## Running Tests
```bash
# Run all tests
npm test

# Watch mode (development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Testing Principles
1. Test components in isolation
2. Mock external dependencies
3. Cover happy paths and error scenarios
4. Validate role-based access
5. Ensure type safety

## Contribution Guidelines
- Write descriptive test names
- Keep tests focused and atomic
- Use meaningful mock data
- Test both successful and failure scenarios
- Maintain high code quality and readability

## Important Notes
- Tests use prohibition theme context
- Role-based mocking is essential
- Performance and security are top priorities
