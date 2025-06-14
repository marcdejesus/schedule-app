// frontend/src/pages/providers.tsx
import React from 'react';
import { useProviders } from '@/hooks/useProviders';
import { User } from '@/types/auth';

const ProvidersPage: React.FC = () => {
  const { data: providers, isLoading } = useProviders();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Providers</h1>
      <ul>
        {providers?.map((provider: User) => (
          <li key={provider.id}>{provider.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProvidersPage; 