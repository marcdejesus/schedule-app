import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import { providerApi } from '@/lib/provider';
import { useAuth } from './useAuth';

export const useProvider = (providerId: number) => {
  const { token } = useAuth();

  return useQuery(
    ['provider', providerId, token],
    () => providerApi.getProvider(providerId, token),
    {
      enabled: !!token && !!providerId,
      onError: (error: any) => {
        toast.error(error.message || 'Failed to fetch provider details');
      },
    }
  );
}; 