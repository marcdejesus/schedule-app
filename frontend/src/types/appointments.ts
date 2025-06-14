export interface Appointment {
  id: string;
  provider_id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithUsers extends Appointment {
  provider: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  client: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface CreateAppointmentData {
  provider_id: string;
  client_id?: string;
  start_time: string;
  end_time: string;
  notes?: string;
  // For public booking
  client_name?: string;
  client_email?: string;
}

export interface UpdateAppointmentData {
  start_time?: string;
  end_time?: string;
  notes?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  cancellation_reason?: string;
}

export interface AppointmentResponse {
  data: {
    id: string;
    type: string;
    attributes: Appointment;
  };
}

export interface AppointmentsResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: AppointmentWithUsers;
  }>;
}

export interface BookingSlot {
  start: Date;
  end: Date;
  startTime: string; // UTC ISO string
  endTime: string;   // UTC ISO string
  display: string;   // User-friendly time display
  available: boolean;
}

export interface Provider {
  id: string;
  name: string;
  email: string;
  timezone?: string;
  bio?: string;
  title?: string;
}

export interface BookingData {
  provider_id: string;
  start_time: string;
  end_time: string;
  client_name: string;
  client_email: string;
  notes?: string;
}

export interface BookingConfirmation {
  appointment: Appointment;
  provider: Provider;
  client: {
    name: string;
    email: string;
  };
  booking_url?: string;
} 