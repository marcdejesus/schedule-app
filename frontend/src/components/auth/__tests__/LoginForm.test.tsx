import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { renderWithoutAuth, createMockUser } from '@/lib/test-utils';

// Mock the useAuth hook
const mockLogin = jest.fn();
const mockHandleOAuthCallback = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    handleOAuthCallback: mockHandleOAuthCallback,
  }),
}));

// Mock next/router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    push: mockPush,
    replace: mockReplace,
    pathname: '/login',
  }),
}));

describe('LoginForm', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithoutAuth(<LoginForm />);
    
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('shows demo account information', () => {
    renderWithoutAuth(<LoginForm />);
    
    expect(screen.getByText(/demo accounts:/i)).toBeInTheDocument();
    expect(screen.getByText(/admin@scheduleease.com/i)).toBeInTheDocument();
    expect(screen.getByText(/provider@scheduleease.com/i)).toBeInTheDocument();
    expect(screen.getByText(/client@scheduleease.com/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithoutAuth(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderWithoutAuth(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    renderWithoutAuth(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockOnSuccess = jest.fn();
    mockLogin.mockResolvedValueOnce(undefined);
    
    renderWithoutAuth(<LoginForm onSuccess={mockOnSuccess} />);
    
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    renderWithoutAuth(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('handles Google OAuth sign in', async () => {
    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;
    
    renderWithoutAuth(<LoginForm />);
    
    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    await user.click(googleButton);
    
    expect(window.location.href).toBe('http://localhost:3001/users/auth/google_oauth2');
  });

  it('switches to register form', async () => {
    const mockOnSwitchToRegister = jest.fn();
    
    renderWithoutAuth(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />);
    
    const switchButton = screen.getByRole('button', { name: /create a new account/i });
    await user.click(switchButton);
    
    expect(mockOnSwitchToRegister).toHaveBeenCalled();
  });

  it('handles OAuth callback with token', async () => {
    const mockOnSuccess = jest.fn();
    mockHandleOAuthCallback.mockResolvedValueOnce(createMockUser());
    
    // Mock router with token in query
    jest.mocked(require('next/router').useRouter).mockReturnValue({
      query: { token: 'oauth-token' },
      push: mockPush,
      replace: mockReplace,
      pathname: '/login',
    });
    
    renderWithoutAuth(<LoginForm onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(mockHandleOAuthCallback).toHaveBeenCalledWith('oauth-token');
      expect(mockReplace).toHaveBeenCalledWith('/login');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles OAuth callback with error', async () => {
    // Mock router with error in query
    jest.mocked(require('next/router').useRouter).mockReturnValue({
      query: { error: 'access_denied' },
      push: mockPush,
      replace: mockReplace,
      pathname: '/login',
    });
    
    renderWithoutAuth(<LoginForm />);
    
    await waitFor(() => {
      expect(screen.getByText(/access_denied/i)).toBeInTheDocument();
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('handles OAuth callback failure', async () => {
    const mockOnSuccess = jest.fn();
    mockHandleOAuthCallback.mockRejectedValueOnce(new Error('OAuth failed'));
    
    // Mock router with token in query
    jest.mocked(require('next/router').useRouter).mockReturnValue({
      query: { token: 'invalid-token' },
      push: mockPush,
      replace: mockReplace,
      pathname: '/login',
    });
    
    renderWithoutAuth(<LoginForm onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to authenticate with google/i)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('shows loading state during submission', async () => {
    // Mock loading state
    jest.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      handleOAuthCallback: mockHandleOAuthCallback,
    });
    
    renderWithoutAuth(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /signing in.../i });
    expect(submitButton).toBeDisabled();
  });
}); 