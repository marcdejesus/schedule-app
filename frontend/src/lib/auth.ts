import { LoginData, RegisterData, AuthResponse, User } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class AuthError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AuthError';
  }
}

export const authApi = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new AuthError(result.message || 'Login failed', response.status);
    }

    return result;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: data }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new AuthError(result.message || 'Registration failed', response.status);
    }

    return result;
  },

  async getCurrentUser(token: string): Promise<User> {
    console.log('authApi: getCurrentUser called with token:', token);
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions/current`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('authApi: getCurrentUser response status:', response.status);

    const data = await response.json();
    console.log('authApi: getCurrentUser response data:', data);

    if (!response.ok) {
      throw new AuthError(data.message || 'Failed to get user', response.status);
    }
    return data.data.attributes;
  },

  async logout(token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const result = await response.json();
      throw new AuthError(result.message || 'Logout failed', response.status);
    }
  },

  async logoutAllSessions(token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions/all`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const result = await response.json();
      throw new AuthError(result.message || 'Failed to logout all sessions', response.status);
    }
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/password/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new AuthError(result.message || 'Password reset request failed', response.status);
    }

    return result;
  },

  async resetPassword(token: string, password: string, passwordConfirmation: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/password/reset`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reset_password_token: token,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new AuthError(result.message || 'Password reset failed', response.status);
    }

    return result;
  },

  async verifyPasswordResetToken(token: string): Promise<{ user: { email: string; name: string } }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/password/reset/verify?reset_password_token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new AuthError(result.message || 'Invalid reset token', response.status);
    }

    return result;
  },

  async resendEmailConfirmation(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/email/resend_confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new AuthError(result.message || 'Failed to resend confirmation', response.status);
    }

    return result;
  },

  async confirmEmail(token: string): Promise<{ user: User; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/email/confirm?confirmation_token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new AuthError(result.message || 'Email confirmation failed', response.status);
    }

    return result;
  },

  async verifyEmailConfirmationToken(token: string): Promise<{ user: { email: string; name: string } }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/email/verify?confirmation_token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new AuthError(result.message || 'Invalid confirmation token', response.status);
    }

    return result;
  },

  async getSessionInfo(token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/v1/sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new AuthError(result.message || 'Failed to get session info', response.status);
    }

    return result;
  },

  async verifyOAuthToken(token: string, signupData?: { role?: string }): Promise<AuthResponse> {
    console.log('authApi: verifyOAuthToken called');
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/oauth/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: signupData ? JSON.stringify(signupData) : undefined
    });

    const data = await response.json();
    if (!response.ok) {
      throw new AuthError(data.message || 'Failed to verify OAuth token', response.status);
    }
    
    return data;
  },
};

// Token management utilities
export const tokenStorage = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },

  set(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  },

  remove(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  },
}; 