import axios from 'axios';
import { 
  Provider, 
  BookingData, 
  BookingConfirmation, 
  BookingSlot,
  CreateAppointmentData,
  AppointmentResponse,
  AppointmentsResponse
} from '@/types/appointments';
import { AvailabilitySlot } from '@/types/availability';
import { TimezoneUtils } from './timezone';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with auth header for authenticated requests
const createAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export class BookingError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: string[]
  ) {
    super(message);
    this.name = 'BookingError';
  }
}

export const bookingApi = {
  // Get provider information (public endpoint)
  async getProvider(providerId: string): Promise<Provider> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/public/providers/${providerId}`);
      return response.data.data.attributes;
    } catch (error: any) {
      throw new BookingError(
        'Failed to fetch provider information',
        error.response?.status,
        error.response?.data?.details
      );
    }
  },

  // Get provider's availability (public endpoint)
  async getProviderAvailability(providerId: string, date?: Date): Promise<AvailabilitySlot[]> {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date.toISOString().split('T')[0]);

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/public/providers/${providerId}/availability?${params.toString()}`
      );

      return response.data.data.map((item: any) => item.attributes);
    } catch (error: any) {
      throw new BookingError(
        'Failed to fetch provider availability',
        error.response?.status,
        error.response?.data?.details
      );
    }
  },

  // Get available booking slots for a date (public endpoint)
  async getAvailableSlots(
    providerId: string, 
    date: Date, 
    timezone?: string
  ): Promise<BookingSlot[]> {
    try {
      const availability = await this.getProviderAvailability(providerId, date);
      const userTz = timezone || TimezoneUtils.getUserTimezone();
      
      const slots: BookingSlot[] = [];
      
      availability.forEach(slot => {
        const slotStart = TimezoneUtils.utcToLocal(slot.start_time, userTz);
        const slotEnd = TimezoneUtils.utcToLocal(slot.end_time, userTz);
        
        // Check if slot is on the requested date
        if (TimezoneUtils.isSameDay(slotStart, date, userTz)) {
          // Generate 30-minute time slots
          let current = new Date(slotStart);
          while (current < slotEnd) {
            const next = new Date(current.getTime() + 30 * 60000); // 30 minutes
            if (next <= slotEnd) {
              // Convert back to UTC for storage
              const utcStart = TimezoneUtils.localToUtc(current, userTz);
              const utcEnd = TimezoneUtils.localToUtc(next, userTz);
              
              slots.push({
                start: new Date(current),
                end: new Date(next),
                startTime: utcStart.toISOString(),
                endTime: utcEnd.toISOString(),
                display: TimezoneUtils.formatTimeRange(current, next, userTz),
                available: true // TODO: Check against existing appointments
              });
            }
            current = next;
          }
        }
      });

      return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
    } catch (error: any) {
      if (error instanceof BookingError) throw error;
      throw new BookingError(
        'Failed to get available slots',
        error.response?.status,
        error.response?.data?.details
      );
    }
  },

  // Create public booking (no authentication required)
  async createPublicBooking(bookingData: BookingData): Promise<BookingConfirmation> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/public/bookings`,
        { booking: bookingData }
      );

      return response.data;
    } catch (error: any) {
      throw new BookingError(
        'Failed to create booking',
        error.response?.status,
        error.response?.data?.details || error.response?.data?.error
      );
    }
  },

  // Get booking confirmation (public endpoint)
  async getBookingConfirmation(confirmationId: string): Promise<BookingConfirmation> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/public/bookings/${confirmationId}`
      );

      return response.data;
    } catch (error: any) {
      throw new BookingError(
        'Failed to fetch booking confirmation',
        error.response?.status,
        error.response?.data?.details
      );
    }
  }
};

// Authenticated appointment API (for logged-in users)
export const appointmentApi = {
  // Get appointments for current user
  async getAppointments(filters?: {
    start_date?: string;
    end_date?: string;
    status?: string;
    provider_id?: string;
  }): Promise<AppointmentsResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/appointments?${params.toString()}`,
        { headers: createAuthHeaders() }
      );

      return response.data;
    } catch (error: any) {
      throw new BookingError(
        'Failed to fetch appointments',
        error.response?.status,
        error.response?.data?.details
      );
    }
  },

  // Create appointment (authenticated)
  async createAppointment(data: CreateAppointmentData): Promise<AppointmentResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/appointments`,
        { appointment: data },
        { headers: createAuthHeaders() }
      );

      return response.data;
    } catch (error: any) {
      throw new BookingError(
        'Failed to create appointment',
        error.response?.status,
        error.response?.data?.details
      );
    }
  },

  // Cancel appointment
  async cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/v1/appointments/${appointmentId}/cancel`,
        { cancellation_reason: reason },
        { headers: createAuthHeaders() }
      );
    } catch (error: any) {
      throw new BookingError(
        'Failed to cancel appointment',
        error.response?.status,
        error.response?.data?.details
      );
    }
  },

  // Confirm appointment (provider only)
  async confirmAppointment(appointmentId: string): Promise<void> {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/v1/appointments/${appointmentId}/confirm`,
        {},
        { headers: createAuthHeaders() }
      );
    } catch (error: any) {
      throw new BookingError(
        'Failed to confirm appointment',
        error.response?.status,
        error.response?.data?.details
      );
    }
  }
}; 