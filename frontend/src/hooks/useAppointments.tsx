import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { appointmentApi } from '@/lib/booking';
import { AppointmentsResponse, AppointmentWithUsers } from '@/types/appointments';
import { useAuth } from './useAuth';
import { useMemo } from 'react';

interface AppointmentFilters {
  start_date?: string;
  end_date?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  provider_id?: string;
}

// Query key constants for better maintainability
const QUERY_KEYS = {
  appointments: 'appointments',
  upcoming: 'upcoming',
  past: 'past',
} as const;

// Utility function to transform appointment data
const transformAppointmentData = (appointmentsResponse: any): AppointmentWithUsers[] => {
  if (!appointmentsResponse?.data) return [];

  // Create a lookup map for included resources
  const includedMap = new Map();
  if (appointmentsResponse.included) {
    appointmentsResponse.included.forEach((item: any) => {
      includedMap.set(`${item.type}-${item.id}`, item.attributes);
    });
  }

  return appointmentsResponse.data.map((item: any) => {
    const appointment = {
      ...item.attributes,
      id: item.id
    };

    // Add provider data from included resources
    if (item.relationships?.provider?.data) {
      const providerId = item.relationships.provider.data.id;
      const providerData = includedMap.get(`user-${providerId}`);
      if (providerData) {
        appointment.provider = {
          id: providerId,
          name: providerData.name,
          email: providerData.email,
          role: providerData.role
        };
      }
    }

    // Add client data from included resources
    if (item.relationships?.client?.data) {
      const clientId = item.relationships.client.data.id;
      const clientData = includedMap.get(`user-${clientId}`);
      if (clientData) {
        appointment.client = {
          id: clientId,
          name: clientData.name,
          email: clientData.email,
          role: clientData.role
        };
      }
    }

    return appointment as AppointmentWithUsers;
  });
};

export const useAppointments = (filters?: AppointmentFilters) => {
  const queryClient = useQueryClient();
  const { token, isAuthenticated, isInitialized, logout } = useAuth();

  console.log('useAppointments - Auth state:', { 
    token: !!token, 
    isAuthenticated, 
    isInitialized
  });

  // If auth is not initialized or user is not authenticated, return early with empty state
  if (!isInitialized || !isAuthenticated || !token) {
    console.log('useAppointments - Auth not ready, returning early');
    return {
      appointments: [],
      isLoading: false,
      error: null,
      refetch: () => Promise.resolve(),
      cancelAppointment: () => {},
      confirmAppointment: () => {},
      isCancelling: false,
      isConfirming: false
    };
  }

  // Fetch appointments with filters
  const {
    data: appointmentsResponse,
    isLoading,
    error,
    refetch
  } = useQuery(
    [QUERY_KEYS.appointments, filters, token],
    () => {
      console.log('useAppointments - Running query with token:', !!token);
      return appointmentApi.getAppointments(token, filters);
    },
    {
      onError: (error: any) => {
        console.error('Appointments fetch error:', error);
        
        // Handle authentication errors
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          console.log('Authentication error in appointments, logging out');
          logout();
          return;
        }
        
        toast.error(error.message || 'Failed to fetch appointments');
      },
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          return false;
        }
        return failureCount < 3;
      }
    }
  );

  const appointments: AppointmentWithUsers[] = useMemo(
    () => transformAppointmentData(appointmentsResponse),
    [appointmentsResponse]
  );

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation(
    ({ appointmentId, reason }: { appointmentId: string; reason?: string }) =>
      appointmentApi.cancelAppointment(token, appointmentId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QUERY_KEYS.appointments]);
        toast.success('Appointment cancelled successfully');
      },
      onError: (error: any) => {
        console.error('Cancel appointment error:', error);
        
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          logout();
          return;
        }
        
        toast.error(error.message || 'Failed to cancel appointment');
      }
    }
  );

  // Confirm appointment mutation
  const confirmAppointmentMutation = useMutation(
    (appointmentId: string) => appointmentApi.confirmAppointment(token, appointmentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QUERY_KEYS.appointments]);
        toast.success('Appointment confirmed successfully');
      },
      onError: (error: any) => {
        console.error('Confirm appointment error:', error);
        
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          logout();
          return;
        }
        
        toast.error(error.message || 'Failed to confirm appointment');
      }
    }
  );

  return {
    appointments,
    isLoading,
    error,
    refetch,
    cancelAppointment: cancelAppointmentMutation.mutate,
    confirmAppointment: confirmAppointmentMutation.mutate,
    isCancelling: cancelAppointmentMutation.isLoading,
    isConfirming: confirmAppointmentMutation.isLoading
  };
};

export const useUpcomingAppointments = () => {
  const { token, isAuthenticated, isInitialized, logout } = useAuth();
  
  console.log('useUpcomingAppointments - Auth state:', { 
    token: !!token, 
    isAuthenticated, 
    isInitialized 
  });
  
  // If auth is not initialized or user is not authenticated, return early with empty state
  if (!isInitialized || !isAuthenticated || !token) {
    console.log('useUpcomingAppointments - Auth not ready, returning early');
    return {
      data: undefined,
      isLoading: false,
      error: null,
      refetch: () => Promise.resolve()
    };
  }
  
  // Memoize the date to prevent unnecessary re-renders
  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  return useQuery(
    [QUERY_KEYS.appointments, QUERY_KEYS.upcoming, token, todayDate],
    () => {
      console.log('useUpcomingAppointments - Running query with token:', !!token);
      return appointmentApi.getAppointments(token, {
        start_date: todayDate
      });
    },
    {
      onError: (error: any) => {
        console.error('Upcoming appointments fetch error:', error);
        
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          console.log('Authentication error in upcoming appointments, logging out');
          logout();
          return;
        }
        
        toast.error(error.message || 'Failed to fetch upcoming appointments');
      },
      retry: (failureCount, error: any) => {
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          return false;
        }
        return failureCount < 3;
      }
    }
  );
};

export const usePastAppointments = () => {
  const { token, isAuthenticated, isInitialized, logout } = useAuth();
  
  console.log('usePastAppointments - Auth state:', { 
    token: !!token, 
    isAuthenticated, 
    isInitialized 
  });
  
  // If auth is not initialized or user is not authenticated, return early with empty state
  if (!isInitialized || !isAuthenticated || !token) {
    console.log('usePastAppointments - Auth not ready, returning early');
    return {
      data: undefined,
      isLoading: false,
      error: null,
      refetch: () => Promise.resolve()
    };
  }
  
  // Memoize the yesterday date to prevent recreation on every render
  const yesterdayDate = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }, []);
  
  return useQuery(
    [QUERY_KEYS.appointments, QUERY_KEYS.past, token, yesterdayDate],
    () => {
      console.log('usePastAppointments - Running query with token:', !!token);
      return appointmentApi.getAppointments(token, {
        end_date: yesterdayDate
      });
    },
    {
      onError: (error: any) => {
        console.error('Past appointments fetch error:', error);
        
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          console.log('Authentication error in past appointments, logging out');
          logout();
          return;
        }
        
        toast.error(error.message || 'Failed to fetch past appointments');
      },
      retry: (failureCount, error: any) => {
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          return false;
        }
        return failureCount < 3;
      }
    }
  );
};