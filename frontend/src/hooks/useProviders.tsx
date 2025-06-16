import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import { providerApi } from '@/lib/provider';
import { useAuth } from './useAuth';

export const useProviders = () => {
  const { token } = useAuth();

  return useQuery(
    ['providers', token],
    () => providerApi.getProviders(token),
    {
      enabled: !!token,
      onError: (error: any) => {
        toast.error(error.message || 'Failed to fetch providers');
      },
    }
  );
}; 