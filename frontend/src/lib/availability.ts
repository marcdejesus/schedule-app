import axios from 'axios';
import { format } from 'date-fns';
import {
  AvailabilitySlot,
  CreateAvailabilitySlotData,
  UpdateAvailabilitySlotData,
  AvailabilitySlotResponse,
  AvailabilitySlotsResponse,
  CalendarEvent
} from '@/types/availability';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with auth header
const createAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export class AvailabilityError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: string[]
  ) {
    super(message);
    this.name = 'AvailabilityError';
  }
}

export const availabilityApi = {
  // Get availability slots for a user
  async getAvailabilitySlots(userId?: string, date?: Date): Promise<AvailabilitySlot[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (date) params.append('date', format(date, 'yyyy-MM-dd'));

      const response = await axios.get<AvailabilitySlotsResponse>(
        `${API_BASE_URL}/api/v1/availability_slots?${params.toString()}`,
        { headers: createAuthHeaders() }
      );

      return response.data.data.map(item => item.attributes);
    } catch (error: any) {
      throw new AvailabilityError(
        'Failed to fetch availability slots',
        error.response?.status,
        error.response?.data?.details
      );
    }
  },

  // Get available slots for a user and date
  async getAvailableSlots(userId?: string, date?: Date): Promise<AvailabilitySlot[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (date) params.append('date', format(date, 'yyyy-MM-dd'));

      const response = await axios.get<AvailabilitySlotsResponse>(
        `${API_BASE_URL}/api/v1/availability_slots/available?${params.toString()}`,
        { headers: createAuthHeaders() }
      );

      return response.data.data.map(item => item.attributes);
    } catch (error: any) {
      throw new AvailabilityError(
        'Failed to fetch available slots',
        error.response?.status,
        error.response?.data?.details
      );
    }
  },

  // Create a new availability slot
  async createAvailabilitySlot(data: CreateAvailabilitySlotData): Promise<AvailabilitySlot> {
    try {
      const response = await axios.post<AvailabilitySlotResponse>(
        `${API_BASE_URL}/api/v1/availability_slots`,
        { availability_slot: data },
        { headers: createAuthHeaders() }
      );

      return response.data.data.attributes;
    } catch (error: any) {
      throw new AvailabilityError(
        'Failed to create availability slot',
        error.response?.status,
        error.response?.data?.details
      );
    }
  },

  // Update an availability slot
  async updateAvailabilitySlot(id: string, data: UpdateAvailabilitySlotData): Promise<AvailabilitySlot> {
    try {
      const response = await axios.put<AvailabilitySlotResponse>(
        `${API_BASE_URL}/api/v1/availability_slots/${id}`,
        { availability_slot: data },
        { headers: createAuthHeaders() }
      );

      return response.data.data.attributes;
    } catch (error: any) {
      throw new AvailabilityError(
        'Failed to update availability slot',
        error.response?.status,
        error.response?.data?.details
      );
    }
  },

  // Delete an availability slot
  async deleteAvailabilitySlot(id: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/availability_slots/${id}`,
        { headers: createAuthHeaders() }
      );
    } catch (error: any) {
      throw new AvailabilityError(
        'Failed to delete availability slot',
        error.response?.status,
        error.response?.data?.details
      );
    }
  },

  // Get a single availability slot
  async getAvailabilitySlot(id: string): Promise<AvailabilitySlot> {
    try {
      const response = await axios.get<AvailabilitySlotResponse>(
        `${API_BASE_URL}/api/v1/availability_slots/${id}`,
        { headers: createAuthHeaders() }
      );

      return response.data.data.attributes;
    } catch (error: any) {
      throw new AvailabilityError(
        'Failed to fetch availability slot',
        error.response?.status,
        error.response?.data?.details
      );
    }
  }
};

// Utility functions for calendar integration
export const calendarUtils = {
  // Convert availability slots to calendar events
  slotsToCalendarEvents(slots: AvailabilitySlot[]): CalendarEvent[] {
    return slots.map(slot => ({
      id: slot.id,
      title: `Available ${format(new Date(slot.start_time), 'HH:mm')} - ${format(new Date(slot.end_time), 'HH:mm')}`,
      start: new Date(slot.start_time),
      end: new Date(slot.end_time),
      isAvailable: true,
      notes: slot.notes
    }));
  },

  // Generate time slots for a day
  generateTimeSlots(startHour = 9, endHour = 17, intervalMinutes = 30) {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        slots.push({
          hour,
          minute,
          display: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        });
      }
    }
    return slots;
  },

  // Check if a time slot is available
  isTimeSlotAvailable(slots: AvailabilitySlot[], date: Date, hour: number, minute: number): boolean {
    const checkTime = new Date(date);
    checkTime.setHours(hour, minute, 0, 0);

    return slots.some(slot => {
      const startTime = new Date(slot.start_time);
      const endTime = new Date(slot.end_time);
      return checkTime >= startTime && checkTime < endTime;
    });
  },

  // Format duration
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }
}; 