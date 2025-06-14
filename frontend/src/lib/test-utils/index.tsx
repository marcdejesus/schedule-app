import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
// import { AuthProvider } from '@/contexts/AuthContext';
import { User } from '@/types/auth';

// Create a custom render function that includes providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialUser?: User | null;
  queryClient?: QueryClient;
}

const AllTheProviders = ({ 
  children, 
  queryClient = createTestQueryClient()
}: {
  children: React.ReactNode;
  queryClient?: QueryClient;
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, ...renderOptions } = options;
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders queryClient={queryClient}>
      {children}
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Test utilities for common scenarios
export const renderWithAuth = (
  ui: ReactElement,
  user: User = (global as any).testUser,
  options: Omit<CustomRenderOptions, 'initialUser'> = {}
) => {
  return customRender(ui, options);
};

export const renderWithProvider = (
  ui: ReactElement,
  options: Omit<CustomRenderOptions, 'initialUser'> = {}
) => {
  return customRender(ui, options);
};

export const renderWithAdmin = (
  ui: ReactElement,
  options: Omit<CustomRenderOptions, 'initialUser'> = {}
) => {
  return customRender(ui, options);
};

export const renderWithoutAuth = (
  ui: ReactElement,
  options: Omit<CustomRenderOptions, 'initialUser'> = {}
) => {
  return customRender(ui, { ...options, initialUser: null });
};

// Mock data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: 'client',
  ...overrides,
});

export const createMockProvider = (overrides: Partial<User> = {}): User => ({
  id: 2,
  email: 'provider@example.com',
  name: 'Test Provider',
  role: 'provider',
  ...overrides,
});

export const createMockAppointment = (overrides: any = {}) => ({
  id: '1',
  type: 'appointment',
  attributes: {
    start_time: '2023-12-01T10:00:00Z',
    end_time: '2023-12-01T11:00:00Z',
    status: 'pending',
    notes: 'Test appointment',
    cancellation_reason: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    ...overrides.attributes,
  },
  relationships: {
    service: {
      data: { id: '1', type: 'service' }
    },
    client: {
      data: { id: '1', type: 'user' }
    },
    provider: {
      data: { id: '2', type: 'user' }
    },
    ...overrides.relationships,
  },
});

export const createMockService = (overrides: any = {}) => ({
  id: '1',
  type: 'service',
  attributes: {
    name: 'Test Service',
    description: 'A test service',
    duration: 60,
    price: 100,
    is_active: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    ...overrides.attributes,
  },
  relationships: {
    provider: {
      data: { id: '2', type: 'user' }
    },
    ...overrides.relationships,
  },
});

// Wait utilities
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Form utilities
export const fillForm = async (
  getByLabelText: any,
  userEvent: any,
  formData: Record<string, string>
) => {
  for (const [label, value] of Object.entries(formData)) {
    const input = getByLabelText(new RegExp(label, 'i'));
    await userEvent.clear(input);
    await userEvent.type(input, value);
  }
};

// Accessibility testing utilities
export const axeMatchers = {
  toHaveNoViolations: expect.extend(require('jest-axe').toHaveNoViolations),
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export our custom render as the default render
export { customRender as render, createTestQueryClient }; 