import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { appointmentApi } from '@/lib/booking';
import { AppointmentsResponse, AppointmentWithUsers } from '@/types/appointments';
import { useAuth } from './useAuth';

interface AppointmentFilters {
  start_date?: string;
  end_date?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  provider_id?: string;
}

export const useAppointments = (filters?: AppointmentFilters) => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  // Fetch appointments with filters
  const {
    data: appointmentsResponse,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['appointments', filters, token],
    () => appointmentApi.getAppointments(token, filters),
    {
      enabled: !!token,
      onError: (error: any) => {
        toast.error(error.message || 'Failed to fetch appointments');
      }
    }
  );

  const appointments: AppointmentWithUsers[] = appointmentsResponse?.data?.map(item => ({
    ...item.attributes,
    id: item.id
  })) || [];

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation(
    ({ appointmentId, reason }: { appointmentId: string; reason?: string }) =>
      appointmentApi.cancelAppointment(token, appointmentId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['appointments']);
        toast.success('Appointment cancelled successfully');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to cancel appointment');
      }
    }
  );

  // Confirm appointment mutation
  const confirmAppointmentMutation = useMutation(
    (appointmentId: string) => appointmentApi.confirmAppointment(token, appointmentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['appointments']);
        toast.success('Appointment confirmed successfully');
      },
      onError: (error: any) => {
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
  const { token } = useAuth();
  return useQuery(
    ['appointments', 'upcoming', token],
    () => appointmentApi.getAppointments(token, {
      start_date: new Date().toISOString().split('T')[0]
    }),
    {
      enabled: !!token,
      onError: (error: any) => {
        toast.error(error.message || 'Failed to fetch upcoming appointments');
      }
    }
  );
};

export const usePastAppointments = () => {
  const { token } = useAuth();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return useQuery(
    ['appointments', 'past', token],
    () => appointmentApi.getAppointments(token, {
      end_date: yesterday.toISOString().split('T')[0]
    }),
    {
      enabled: !!token,
      onError: (error: any) => {
        toast.error(error.message || 'Failed to fetch past appointments');
      }
    }
  );
}; 