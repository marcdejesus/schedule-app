export interface AvailabilitySlot {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  recurring: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAvailabilitySlotData {
  start_time: string;
  end_time: string;
  recurring?: boolean;
  notes?: string;
}

export interface UpdateAvailabilitySlotData {
  start_time?: string;
  end_time?: string;
  recurring?: boolean;
  notes?: string;
}

export interface AvailabilitySlotResponse {
  data: {
    id: string;
    type: string;
    attributes: AvailabilitySlot;
  };
}

export interface AvailabilitySlotsResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: AvailabilitySlot;
  }>;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isAvailable: boolean;
  notes?: string;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  display: string;
}

export interface DayAvailability {
  date: Date;
  slots: AvailabilitySlot[];
  isAvailable: boolean;
} 