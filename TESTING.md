# Testing Guide

This document outlines the testing strategy and setup for the ScheduleEase application.

## Overview

The project uses a comprehensive testing approach with:
- **Backend**: RSpec for unit, integration, and request specs
- **Frontend**: Jest + React Testing Library for component and integration tests
- **E2E**: Playwright for end-to-end testing
- **CI/CD**: GitHub Actions for automated testing and deployment

## Backend Testing (Rails API)

### Test Framework
- **RSpec**: Main testing framework
- **FactoryBot**: Test data generation
- **Shoulda Matchers**: Rails-specific matchers
- **WebMock + VCR**: HTTP request mocking
- **SimpleCov**: Code coverage reporting

### Test Types

#### Unit Tests
Located in `api/spec/models/` and `api/spec/lib/`
```bash
# Run model tests
bundle exec rspec spec/models/

# Run specific model test
bundle exec rspec spec/models/user_spec.rb
```

#### Request Tests
Located in `api/spec/requests/`
```bash
# Run all request specs
bundle exec rspec spec/requests/

# Run specific endpoint tests
bundle exec rspec spec/requests/appointments_spec.rb
```

#### Integration Tests
Located in `api/spec/integration/`
```bash
# Run integration tests
bundle exec rspec spec/integration/
```

### Running Backend Tests

```bash
cd api

# Install dependencies
bundle install

# Set up test database
RAILS_ENV=test bundle exec rails db:create db:schema:load

# Run all tests
bundle exec rspec

# Run with coverage
COVERAGE=true bundle exec rspec

# Run specific test file
bundle exec rspec spec/requests/appointments_spec.rb

# Run specific test
bundle exec rspec spec/requests/appointments_spec.rb:10
```

### Test Helpers

#### Authentication Helper
```ruby
# Sign in a user for request specs
sign_in(user)

# Create and sign in different user types
create_and_sign_in_admin
create_and_sign_in_provider
create_and_sign_in_client

# Generate auth tokens
auth_token_for(user)
expired_auth_token_for(user)
```

#### Request Helper
```ruby
# JSON API requests
post_json '/api/appointments', payload, headers
get_json '/api/appointments', params, headers

# Response expectations
expect_json_api_success
expect_json_api_error
expect_authentication_required
expect_authorization_required
```

#### JSON Helper
```ruby
# Access response data
json_response
json_data
json_errors
json_meta

# Build JSON API payloads
json_api_payload('appointment', attributes, relationships)
```

## Frontend Testing (Next.js)

### Test Framework
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW**: API mocking (when installed)
- **Jest Axe**: Accessibility testing

### Test Types

#### Component Tests
Located in `frontend/src/components/**/__tests__/`
```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test LoginForm.test.tsx
```

#### Integration Tests
Located in `frontend/src/__tests__/`
```bash
# Run integration tests
npm test -- --testPathPattern=integration
```

#### Hook Tests
Located in `frontend/src/hooks/__tests__/`
```bash
# Run hook tests
npm test -- --testPathPattern=hooks
```

### Running Frontend Tests

```bash
cd frontend

# Install dependencies
npm ci

# Run all tests
npm test

# Run tests in CI mode
npm run test:ci

# Run with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

### Test Utilities

#### Custom Render Functions
```typescript
import { renderWithAuth, renderWithProvider, renderWithAdmin, renderWithoutAuth } from '@/lib/test-utils';

// Render with authenticated user
renderWithAuth(<Component />, mockUser);

// Render with provider user
renderWithProvider(<Component />);

// Render without authentication
renderWithoutAuth(<Component />);
```

#### Mock Data Factories
```typescript
import { createMockUser, createMockProvider, createMockAppointment } from '@/lib/test-utils';

const user = createMockUser({ name: 'Custom Name' });
const appointment = createMockAppointment({ 
  attributes: { status: 'confirmed' } 
});
```

#### User Interactions
```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();

// Type in input
await user.type(screen.getByLabelText(/email/i), 'test@example.com');

// Click button
await user.click(screen.getByRole('button', { name: /submit/i }));

// Select option
await user.selectOptions(screen.getByRole('combobox'), 'option-value');
```

## End-to-End Testing (Playwright)

### Setup
```bash
cd frontend

# Install Playwright
npm install @playwright/test

# Install browsers
npx playwright install
```

### Running E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test
npx playwright test auth.spec.ts
```

### E2E Test Structure
```typescript
// frontend/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[placeholder="Email address"]', 'test@example.com');
    await page.fill('[placeholder="Password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});
```

## Continuous Integration

### GitHub Actions Workflow

The CI pipeline runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

#### Pipeline Stages

1. **Backend Tests**
   - Set up Ruby and dependencies
   - Set up PostgreSQL and Redis
   - Run RSpec tests with coverage
   - Security scanning with Brakeman
   - Code quality with RuboCop

2. **Frontend Tests**
   - Set up Node.js and dependencies
   - Type checking with TypeScript
   - Linting with ESLint
   - Unit tests with Jest
   - Build verification

3. **E2E Tests** (main branch only)
   - Full application setup
   - Playwright tests
   - Screenshot and video capture

4. **Coverage Reporting**
   - Combine backend and frontend coverage
   - Upload to Codecov

5. **Deployment** (main branch only)
   - Production deployment
   - Health checks

### Running CI Locally

#### Backend
```bash
cd api

# Install dependencies
bundle install

# Set up test environment
RAILS_ENV=test bundle exec rails db:create db:schema:load

# Run full test suite
COVERAGE=true bundle exec rspec

# Security scan
bundle exec brakeman --quiet --exit-on-warn

# Code quality
bundle exec rubocop
```

#### Frontend
```bash
cd frontend

# Install dependencies
npm ci

# Type check
npm run type-check

# Lint
npm run lint

# Test with coverage
npm run test:ci

# Build
npm run build
```

## Coverage Requirements

### Backend Coverage Targets
- **Minimum**: 80% overall coverage
- **Per file**: 70% minimum coverage
- **Branches**: 70% minimum coverage

### Frontend Coverage Targets
- **Minimum**: 70% overall coverage
- **Functions**: 70% minimum coverage
- **Lines**: 70% minimum coverage
- **Branches**: 70% minimum coverage

## Best Practices

### Backend Testing
1. **Use factories** instead of fixtures for test data
2. **Test behavior**, not implementation
3. **Mock external services** with VCR cassettes
4. **Test edge cases** and error conditions
5. **Keep tests fast** by avoiding unnecessary database calls

### Frontend Testing
1. **Test user interactions**, not implementation details
2. **Use semantic queries** (getByRole, getByLabelText)
3. **Mock API calls** consistently
4. **Test accessibility** with jest-axe
5. **Avoid testing third-party libraries**

### General Guidelines
1. **Write descriptive test names** that explain the behavior
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Keep tests independent** and isolated
4. **Use meaningful assertions** with clear error messages
5. **Maintain test data** and clean up after tests

## Debugging Tests

### Backend
```bash
# Run with debugging
bundle exec rspec --format documentation

# Run specific test with binding.pry
bundle exec rspec spec/models/user_spec.rb:10

# Check test coverage
open coverage/index.html
```

### Frontend
```bash
# Run tests in debug mode
npm test -- --verbose

# Run specific test
npm test -- --testNamePattern="should render correctly"

# Debug with Chrome DevTools
npm test -- --inspect-brk
```

## Test Data Management

### Backend Factories
```ruby
# api/spec/factories/users.rb
FactoryBot.define do
  factory :user do
    name { Faker::Name.full_name }
    email { Faker::Internet.email }
    password { 'password123' }
    role { 'client' }

    trait :admin do
      role { 'admin' }
    end

    trait :provider do
      role { 'provider' }
    end
  end
end
```

### Frontend Mocks
```typescript
// Mock API responses
const mockAppointments = [
  createMockAppointment({ id: '1' }),
  createMockAppointment({ id: '2', attributes: { status: 'confirmed' } }),
];

// Mock hooks
jest.mock('@/hooks/useAppointments', () => ({
  useAppointments: () => ({
    data: mockAppointments,
    isLoading: false,
    error: null,
  }),
}));
```

## Performance Testing

### Backend
```bash
# Profile test suite
bundle exec rspec --profile

# Check slow tests
bundle exec rspec --format progress --profile 10
```

### Frontend
```bash
# Bundle analysis
npm run analyze

# Performance testing with Lighthouse CI
npm install -g @lhci/cli
lhci autorun
```

## Security Testing

### Backend Security Scans
```bash
# Brakeman security scanner
bundle exec brakeman

# Bundle audit for vulnerable gems
bundle exec bundle-audit check --update

# Database security
bundle exec rails db:environment:set RAILS_ENV=test
```

### Frontend Security
```bash
# Audit npm packages
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

This comprehensive testing setup ensures high code quality, reliability, and maintainability for the ScheduleEase application. 