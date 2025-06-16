import { format, parseISO } from 'date-fns';
import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export interface TimezoneInfo {
  name: string;
  offset: string;
  abbreviation: string;
}

export class TimezoneUtils {
  // Get user's current timezone
  static getUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // Get timezone offset in minutes
  static getTimezoneOffset(timezone?: string): number {
    const tz = timezone || this.getUserTimezone();
    const now = new Date();
    const utcDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const targetDate = new Date(utcDate.toLocaleString('en-US', { timeZone: tz }));
    return (targetDate.getTime() - utcDate.getTime()) / 60000;
  }

  // Convert UTC time to user's timezone
  static utcToLocal(utcTime: string | Date, timezone?: string): Date {
    const tz = timezone || this.getUserTimezone();
    const date = typeof utcTime === 'string' ? parseISO(utcTime) : utcTime;
    return utcToZonedTime(date, tz);
  }

  // Convert local time to UTC
  static localToUtc(localTime: Date, timezone?: string): Date {
    const tz = timezone || this.getUserTimezone();
    return zonedTimeToUtc(localTime, tz);
  }

  // Format time in specific timezone
  static formatInTimezone(
    date: string | Date,
    formatString: string,
    timezone?: string
  ): string {
    const tz = timezone || this.getUserTimezone();
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(dateObj, tz, formatString);
  }

  // Get timezone info for display
  static getTimezoneInfo(timezone?: string): TimezoneInfo {
    const tz = timezone || this.getUserTimezone();
    const now = new Date();
    
    // Get offset
    const offset = this.getTimezoneOffset(tz);
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetSign = offset >= 0 ? '+' : '-';
    const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;

    // Get abbreviation
    const abbreviation = now.toLocaleString('en-US', { 
      timeZone: tz, 
      timeZoneName: 'short' 
    }).split(' ').pop() || '';

    return {
      name: tz,
      offset: offsetString,
      abbreviation
    };
  }

  // Format time range for display
  static formatTimeRange(
    startTime: string | Date,
    endTime: string | Date,
    timezone?: string
  ): string {
    const tz = timezone || this.getUserTimezone();
    const start = this.formatInTimezone(startTime, 'h:mm a', tz);
    const end = this.formatInTimezone(endTime, 'h:mm a', tz);
    return `${start} - ${end}`;
  }

  // Format date with timezone
  static formatDateWithTimezone(
    date: string | Date,
    timezone?: string
  ): string {
    const tz = timezone || this.getUserTimezone();
    const tzInfo = this.getTimezoneInfo(tz);
    return `${this.formatInTimezone(date, 'EEEE, MMMM d, yyyy', tz)} (${tzInfo.abbreviation})`;
  }

  // Check if two dates are the same day in a timezone
  static isSameDay(
    date1: string | Date,
    date2: string | Date,
    timezone?: string
  ): boolean {
    const tz = timezone || this.getUserTimezone();
    const d1 = this.formatInTimezone(date1, 'yyyy-MM-dd', tz);
    const d2 = this.formatInTimezone(date2, 'yyyy-MM-dd', tz);
    return d1 === d2;
  }

  // Get available time slots for a date in user's timezone
  static getAvailableTimeSlots(
    availabilitySlots: Array<{ start_time: string; end_time: string }>,
    date: Date,
    intervalMinutes: number = 30,
    timezone?: string
  ): Array<{ start: Date; end: Date; display: string }> {
    const tz = timezone || this.getUserTimezone();
    const slots: Array<{ start: Date; end: Date; display: string }> = [];

    availabilitySlots.forEach(slot => {
      const slotStart = this.utcToLocal(slot.start_time, tz);
      const slotEnd = this.utcToLocal(slot.end_time, tz);

      // Check if slot is on the requested date
      if (this.isSameDay(slotStart, date, tz)) {
        // Generate time slots within the availability window
        let current = new Date(slotStart);
        while (current < slotEnd) {
          const next = new Date(current.getTime() + intervalMinutes * 60000);
          if (next <= slotEnd) {
            slots.push({
              start: new Date(current),
              end: new Date(next),
              display: this.formatTimeRange(current, next, tz)
            });
          }
          current = next;
        }
      }
    });

    return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  // Common timezone list for dropdowns
  static getCommonTimezones(): Array<{ value: string; label: string }> {
    return [
      { value: 'America/New_York', label: 'Eastern Time (ET)' },
      { value: 'America/Chicago', label: 'Central Time (CT)' },
      { value: 'America/Denver', label: 'Mountain Time (MT)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
      { value: 'America/Phoenix', label: 'Arizona Time (AZ)' },
      { value: 'America/Anchorage', label: 'Alaska Time (AK)' },
      { value: 'Pacific/Honolulu', label: 'Hawaii Time (HI)' },
      { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
      { value: 'Europe/Paris', label: 'Central European Time (CET)' },
      { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
      { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
      { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
      { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
      { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
      { value: 'UTC', label: 'Coordinated Universal Time (UTC)' }
    ];
  }

  // Validate timezone string
  static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }
} 