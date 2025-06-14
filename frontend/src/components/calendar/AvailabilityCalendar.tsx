import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import { format, startOfDay, endOfDay, addMinutes, isSameDay } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, ClockIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAvailability } from '@/hooks/useAvailability';
import { calendarUtils } from '@/lib/availability';
import { AvailabilitySlot, TimeSlot } from '@/types/availability';
import 'react-calendar/dist/Calendar.css';
import '@/styles/calendar.css';

interface AvailabilityCalendarProps {
  userId?: string;
  isReadOnly?: boolean;
  onSlotSelect?: (slot: AvailabilitySlot) => void;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  userId,
  isReadOnly = false,
  onSlotSelect
}) => {
  const {
    availabilitySlots,
    selectedDate,
    setSelectedDate,
    isLoading,
    createSlot,
    deleteSlot,
    getSlotsForDate,
    hasAvailabilityOnDate
  } = useAvailability(userId);

  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<{
    start: TimeSlot | null;
    end: TimeSlot | null;
  }>({ start: null, end: null });

  // Generate time slots for the day
  const timeSlots = useMemo(() => {
    return calendarUtils.generateTimeSlots(9, 17, 30);
  }, []);

  // Get slots for selected date
  const selectedDateSlots = useMemo(() => {
    return getSlotsForDate(selectedDate);
  }, [selectedDate, getSlotsForDate]);

  // Custom tile content for calendar
  const tileContent = ({ date }: { date: Date }) => {
    const hasSlots = hasAvailabilityOnDate(date);
    
    if (hasSlots) {
      return (
        <div className="flex justify-center items-center mt-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      );
    }
    return null;
  };

  // Custom tile class name for calendar
  const tileClassName = ({ date }: { date: Date }) => {
    const hasSlots = hasAvailabilityOnDate(date);
    const isSelected = isSameDay(date, selectedDate);
    
    let className = 'text-sm';
    
    if (hasSlots) {
      className += ' bg-green-50 hover:bg-green-100';
    }
    
    if (isSelected) {
      className += ' !bg-blue-500 !text-white';
    }
    
    return className;
  };

  // Handle date selection
  const handleDateChange = (value: any) => {
    if (!value || Array.isArray(value)) return;
    setSelectedDate(value as Date);
    setShowTimeSlots(true);
    setSelectedTimeRange({ start: null, end: null });
  };

  // Handle time slot selection
  const handleTimeSlotClick = (timeSlot: TimeSlot) => {
    if (isReadOnly) return;

    if (!selectedTimeRange.start) {
      setSelectedTimeRange({ start: timeSlot, end: null });
    } else if (!selectedTimeRange.end) {
      // Ensure end time is after start time
      const startMinutes = selectedTimeRange.start.hour * 60 + selectedTimeRange.start.minute;
      const endMinutes = timeSlot.hour * 60 + timeSlot.minute;
      
      if (endMinutes > startMinutes) {
        setSelectedTimeRange({ ...selectedTimeRange, end: timeSlot });
      } else {
        setSelectedTimeRange({ start: timeSlot, end: null });
      }
    } else {
      // Reset selection
      setSelectedTimeRange({ start: timeSlot, end: null });
    }
  };

  // Create availability slot
  const handleCreateSlot = async () => {
    if (!selectedTimeRange.start || !selectedTimeRange.end) return;

    try {
      const startTime = new Date(selectedDate);
      startTime.setHours(selectedTimeRange.start.hour, selectedTimeRange.start.minute, 0, 0);
      
      const endTime = new Date(selectedDate);
      endTime.setHours(selectedTimeRange.end.hour, selectedTimeRange.end.minute, 0, 0);

      await createSlot({
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        recurring: false
      });

      setSelectedTimeRange({ start: null, end: null });
    } catch (error) {
      console.error('Failed to create availability slot:', error);
    }
  };

  // Delete availability slot
  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlot(slotId);
    } catch (error) {
      console.error('Failed to delete availability slot:', error);
    }
  };

  // Check if time slot is part of existing availability
  const isTimeSlotBooked = (timeSlot: TimeSlot) => {
    const checkTime = new Date(selectedDate);
    checkTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);

    return selectedDateSlots.some(slot => {
      const startTime = new Date(slot.start_time);
      const endTime = new Date(slot.end_time);
      return checkTime >= startTime && checkTime < endTime;
    });
  };

  // Check if time slot is in selected range
  const isTimeSlotInRange = (timeSlot: TimeSlot) => {
    if (!selectedTimeRange.start || !selectedTimeRange.end) return false;
    
    const slotMinutes = timeSlot.hour * 60 + timeSlot.minute;
    const startMinutes = selectedTimeRange.start.hour * 60 + selectedTimeRange.start.minute;
    const endMinutes = selectedTimeRange.end.hour * 60 + selectedTimeRange.end.minute;
    
    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <CalendarDaysIcon className="h-5 w-5 mr-2" />
          {isReadOnly ? 'Available Times' : 'Manage Availability'}
        </h2>
        
        {showTimeSlots && (
          <button
            onClick={() => setShowTimeSlots(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to calendar
          </button>
        )}
      </div>

      {!showTimeSlots ? (
        <div className="calendar-container">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
            minDate={new Date()}
            className="w-full"
            prevLabel={<ChevronLeftIcon className="h-4 w-4" />}
            nextLabel={<ChevronRightIcon className="h-4 w-4" />}
          />
          
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Has availability</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span>Selected date</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="time-slots-container">
          <div className="mb-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className="text-sm text-gray-600">
              {isReadOnly 
                ? 'Available time slots:' 
                : 'Click to select time range, then create availability slot'
              }
            </p>
          </div>

          {/* Existing slots */}
          {selectedDateSlots.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Availability:</h4>
              <div className="space-y-2">
                {selectedDateSlots.map(slot => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md cursor-pointer hover:bg-green-100"
                    onClick={() => onSlotSelect?.(slot)}
                  >
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-green-800">
                        {format(new Date(slot.start_time), 'h:mm a')} - {format(new Date(slot.end_time), 'h:mm a')}
                      </span>
                      {slot.notes && (
                        <span className="ml-2 text-xs text-gray-500">({slot.notes})</span>
                      )}
                    </div>
                    {!isReadOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlot(slot.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time slot grid */}
          {!isReadOnly && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {timeSlots.map(timeSlot => {
                const isBooked = isTimeSlotBooked(timeSlot);
                const isInRange = isTimeSlotInRange(timeSlot);
                const isSelected = selectedTimeRange.start?.display === timeSlot.display;
                
                return (
                  <button
                    key={timeSlot.display}
                    onClick={() => handleTimeSlotClick(timeSlot)}
                    disabled={isBooked}
                    className={`
                      p-2 text-xs rounded border transition-colors
                      ${isBooked 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : isInRange
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : isSelected
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    {timeSlot.display}
                  </button>
                );
              })}
            </div>
          )}

          {/* Create slot button */}
          {!isReadOnly && selectedTimeRange.start && selectedTimeRange.end && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-800">
                    Selected: {selectedTimeRange.start.display} - {selectedTimeRange.end.display}
                  </p>
                  <p className="text-xs text-blue-600">
                    Duration: {calendarUtils.formatDuration(
                      (selectedTimeRange.end.hour * 60 + selectedTimeRange.end.minute) - 
                      (selectedTimeRange.start.hour * 60 + selectedTimeRange.start.minute)
                    )}
                  </p>
                </div>
                <button
                  onClick={handleCreateSlot}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Create Slot
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar; 