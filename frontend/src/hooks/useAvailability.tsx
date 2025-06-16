import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  AvailabilitySlot,
  CreateAvailabilitySlotData,
  UpdateAvailabilitySlotData
} from '@/types/availability';
import { availabilityApi, AvailabilityError } from '@/lib/availability';

export const useAvailability = (userId?: string) => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch availability slots for selected date
  const {
    data: availabilitySlots = [],
    isLoading,
    error,
    refetch
  } = useQuery(
    ['availability-slots', userId, selectedDate],
    () => availabilityApi.getAvailabilitySlots(userId, selectedDate),
    {
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error: AvailabilityError) => {
        toast.error(error.message || 'Failed to load availability');
      }
    }
  );

  // Fetch available slots for selected date
  const {
    data: availableSlots = [],
    isLoading: isLoadingAvailable
  } = useQuery(
    ['available-slots', userId, selectedDate],
    () => availabilityApi.getAvailableSlots(userId, selectedDate),
    {
      enabled: true,
      staleTime: 5 * 60 * 1000,
      onError: (error: AvailabilityError) => {
        toast.error(error.message || 'Failed to load available slots');
      }
    }
  );

  // Create availability slot mutation
  const createSlotMutation = useMutation(
    (data: CreateAvailabilitySlotData) => availabilityApi.createAvailabilitySlot(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['availability-slots']);
        queryClient.invalidateQueries(['available-slots']);
        toast.success('Availability slot created successfully');
      },
      onError: (error: AvailabilityError) => {
        toast.error(error.message || 'Failed to create availability slot');
      }
    }
  );

  // Update availability slot mutation
  const updateSlotMutation = useMutation(
    ({ id, data }: { id: string; data: UpdateAvailabilitySlotData }) =>
      availabilityApi.updateAvailabilitySlot(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['availability-slots']);
        queryClient.invalidateQueries(['available-slots']);
        toast.success('Availability slot updated successfully');
      },
      onError: (error: AvailabilityError) => {
        toast.error(error.message || 'Failed to update availability slot');
      }
    }
  );

  // Delete availability slot mutation
  const deleteSlotMutation = useMutation(
    (id: string) => availabilityApi.deleteAvailabilitySlot(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['availability-slots']);
        queryClient.invalidateQueries(['available-slots']);
        toast.success('Availability slot deleted successfully');
      },
      onError: (error: AvailabilityError) => {
        toast.error(error.message || 'Failed to delete availability slot');
      }
    }
  );

  // Helper functions
  const createSlot = useCallback(
    (data: CreateAvailabilitySlotData) => {
      return createSlotMutation.mutateAsync(data);
    },
    [createSlotMutation]
  );

  const updateSlot = useCallback(
    (id: string, data: UpdateAvailabilitySlotData) => {
      return updateSlotMutation.mutateAsync({ id, data });
    },
    [updateSlotMutation]
  );

  const deleteSlot = useCallback(
    (id: string) => {
      return deleteSlotMutation.mutateAsync(id);
    },
    [deleteSlotMutation]
  );

  const refreshSlots = useCallback(() => {
    refetch();
  }, [refetch]);

  // Get slots for a specific date
  const getSlotsForDate = useCallback(
    (date: Date): AvailabilitySlot[] => {
      return availabilitySlots.filter(slot => {
        const slotDate = new Date(slot.start_time);
        return (
          slotDate.getFullYear() === date.getFullYear() &&
          slotDate.getMonth() === date.getMonth() &&
          slotDate.getDate() === date.getDate()
        );
      });
    },
    [availabilitySlots]
  );

  // Check if a specific date has availability
  const hasAvailabilityOnDate = useCallback(
    (date: Date): boolean => {
      return getSlotsForDate(date).length > 0;
    },
    [getSlotsForDate]
  );

  return {
    // Data
    availabilitySlots,
    availableSlots,
    selectedDate,
    
    // Loading states
    isLoading: isLoading || isLoadingAvailable,
    isCreating: createSlotMutation.isLoading,
    isUpdating: updateSlotMutation.isLoading,
    isDeleting: deleteSlotMutation.isLoading,
    
    // Error states
    error,
    
    // Actions
    createSlot,
    updateSlot,
    deleteSlot,
    refreshSlots,
    setSelectedDate,
    
    // Helpers
    getSlotsForDate,
    hasAvailabilityOnDate
  };
};

export default useAvailability; 