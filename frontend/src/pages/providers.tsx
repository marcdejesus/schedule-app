// frontend/src/pages/providers.tsx
import React, { useEffect, useState } from 'react';
import { User } from '@/types/auth';
import { providerApi, ProviderError } from '@/lib/provider';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

const ProvidersPage: React.FC = () => {
  const { token } = useAuth();
  const [providers, setProviders] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const providerData = await providerApi.getProviders();
        setProviders(providerData);
      } catch (error) {
        const message = error instanceof ProviderError ? error.message : 'Failed to fetch providers';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, [token]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Providers</h1>
      <ul>
        {providers.map((provider) => (
          <li key={provider.id}>{provider.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProvidersPage; 