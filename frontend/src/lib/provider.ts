import { User } from '@/types/auth';
import { tokenStorage } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ProviderError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ProviderError';
  }
}

export const providerApi = {
  async getProviders(): Promise<User[]> {
    const token = tokenStorage.get();
    if (!token) {
      throw new ProviderError('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/providers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ProviderError(data.message || 'Failed to get providers', response.status);
    }
    return data;
  },
}; 