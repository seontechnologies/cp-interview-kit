import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Create a custom render function that includes providers
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface AllTheProvidersProps {
  children: ReactNode;
}

export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient || createQueryClient();

  return function AllTheProviders({ children }: AllTheProvidersProps) {
    return (
      <QueryClientProvider client={client}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options || {};
  const client = queryClient || createQueryClient();

  return {
    ...render(ui, {
      wrapper: createWrapper(client),
      ...renderOptions,
    }),
    queryClient: client,
  };
}

// Mock implementations for common hooks and stores
export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin' as const,
  organizationId: 'org-1',
};

export const mockOwnerUser = {
  ...mockUser,
  id: 'user-2',
  role: 'owner' as const,
};

export const mockUseAuthStore = {
  user: mockUser,
  setUser: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: true,
};

export const mockOrganization = {
  id: 'org-1',
  name: 'Test Organization',
  slug: 'test-org',
  tier: 'pro',
};

export const mockSession = {
  id: 'session-1',
  userAgent: 'Chrome',
  ipAddress: '192.168.1.1',
  lastActiveAt: new Date().toISOString(),
  current: false,
};

export const mockApiKey = {
  id: 'key-1',
  name: 'Production Key',
  prefix: 'sk_test_abc',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
};

export const mockTeamMember = {
  id: 'member-1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'member' as const,
  isActive: true,
  lastLoginAt: new Date().toISOString(),
};

export * from '@testing-library/react';
