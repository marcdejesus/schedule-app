import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from 'react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import Calendar from 'react-calendar';
import { format, addDays, isFuture, startOfDay } from 'date-fns';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserIcon, 
  EnvelopeIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

import { bookingApi, BookingError } from '@/lib/booking';
import { TimezoneUtils } from '@/lib/timezone';
import { Provider, BookingSlot, BookingData } from '@/types/appointments';
import { useAuth } from '@/hooks/useAuth';
import 'react-calendar/dist/Calendar.css';

interface BookingFormData {
  client_name: string;
  client_email: string;
  notes?: string;
  use_account_details: boolean;
}

const PublicBookingPage: React.FC = () => {
  const router = useRouter();
  const { providerId } = router.query;
  const { user, isAuthenticated } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [currentStep, setCurrentStep] = useState<'date' | 'time' | 'details' | 'confirmation'>('date');
  const [userTimezone] = useState(() => TimezoneUtils.getUserTimezone());
  const [useAccountDetails, setUseAccountDetails] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<BookingFormData>({
    defaultValues: {
      use_account_details: false
    }
  });

  const watchUseAccountDetails = watch('use_account_details');

  // Handle account details toggle
  useEffect(() => {
    if (watchUseAccountDetails && user) {
      setValue('client_name', user.name || '');
      setValue('client_email', user.email || '');
      setUseAccountDetails(true);
    } else {
      setValue('client_name', '');
      setValue('client_email', '');
      setUseAccountDetails(false);
    }
  }, [watchUseAccountDetails, user, setValue]);

  // Fetch provider information
  const {
    data: provider,
    isLoading: isLoadingProvider,
    error: providerError
  } = useQuery(
    ['provider', providerId],
    () => bookingApi.getProvider(providerId as string),
    {
      enabled: !!providerId,
      retry: 1,
      onError: (error: BookingError) => {
        toast.error(error.message || 'Failed to load provider information');
      }
    }
  );

  // Fetch available slots for selected date
  const {
    data: availableSlots = [],
    isLoading: isLoadingSlots,
    error: slotsError
  } = useQuery(
    ['available-slots', providerId, selectedDate],
    () => bookingApi.getAvailableSlots(providerId as string, selectedDate, userTimezone),
    {
      enabled: !!providerId && !!selectedDate,
      onError: (error: BookingError) => {
        toast.error(error.message || 'Failed to load available times');
      }
    }
  );

  // Create booking mutation
  const createBookingMutation = useMutation(
    (bookingData: BookingData) => bookingApi.createPublicBooking(bookingData),
    {
      onSuccess: (data) => {
        setCurrentStep('confirmation');
        toast.success('Booking created successfully!');
        console.log('Booking confirmation:', data);
      },
      onError: (error: BookingError) => {
        toast.error(error.message || 'Failed to create booking');
      }
    }
  );

  // Handle date selection
  const handleDateChange = (value: any) => {
    if (!value || Array.isArray(value)) return;
    const date = value as Date;
    
    if (isFuture(startOfDay(date)) || format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
      setSelectedDate(date);
      setSelectedSlot(null);
      setCurrentStep('time');
    }
  };

  // Handle time slot selection
  const handleSlotSelect = (slot: BookingSlot) => {
    setSelectedSlot(slot);
    setCurrentStep('details');
  };

  // Handle booking submission
  const onSubmit = async (formData: BookingFormData) => {
    if (!selectedSlot || !provider) return;

    const bookingData: BookingData = {
      provider_id: provider.id,
      start_time: selectedSlot.startTime,
      end_time: selectedSlot.endTime,
      client_name: formData.client_name,
      client_email: formData.client_email,
      notes: formData.notes
    };

    await createBookingMutation.mutateAsync(bookingData);
  };

  // Calendar tile content - show dots for dates with availability
  const tileContent = ({ date }: { date: Date }) => {
    // This would ideally check against a cache of dates with availability
    // For now, we'll show availability for future dates
    if (isFuture(startOfDay(date))) {
      return (
        <div className="flex justify-center items-center mt-1">
          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
        </div>
      );
    }
    return null;
  };

  // Calendar tile class name
  const tileClassName = ({ date }: { date: Date }) => {
    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    const isDisabled = !isFuture(startOfDay(date)) && format(date, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');
    
    let className = '';
    
    if (isSelected) {
      className += ' !bg-blue-500 !text-white';
    }
    
    if (isDisabled) {
      className += ' !text-gray-400 !cursor-not-allowed';
    }
    
    return className;
  };

  // Loading state
  if (isLoadingProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (providerError || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider Not Found</h1>
          <p className="text-gray-600 mb-4">The booking page you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Book with {provider.name}</h1>
                <p className="text-gray-600">{provider.title || 'Professional Services'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Your timezone</p>
              <p className="text-sm font-medium text-gray-900">
                {TimezoneUtils.getTimezoneInfo(userTimezone).name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main booking flow */}
          <div className="lg:col-span-2">
            {currentStep === 'date' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Date</h2>
                <Calendar
                  onChange={handleDateChange}
                  value={selectedDate}
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  minDate={new Date()}
                  className="w-full"
                />
                <div className="mt-4 text-sm text-gray-600">
                  <p>• Click on a date to see available times</p>
                  <p>• Green dots indicate dates with availability</p>
                </div>
              </div>
            )}

            {currentStep === 'time' && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Available Times for {TimezoneUtils.formatDateWithTimezone(selectedDate, userTimezone)}
                  </h2>
                  <button
                    onClick={() => setCurrentStep('date')}
                    className="text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back
                  </button>
                </div>

                {isLoadingSlots ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleSlotSelect(slot)}
                        className="p-3 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                      >
                        <ClockIcon className="h-4 w-4 mx-auto mb-1 text-gray-500" />
                        <div className="text-sm font-medium text-gray-900">{slot.display}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No available times for this date.</p>
                    <p className="text-sm text-gray-500 mt-2">Please select a different date.</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'details' && selectedSlot && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Your Details</h2>
                  <button
                    onClick={() => setCurrentStep('time')}
                    className="text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back
                  </button>
                </div>

                {/* Selected time summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="font-medium text-blue-900">
                        {TimezoneUtils.formatDateWithTimezone(selectedDate, userTimezone)}
                      </p>
                      <p className="text-sm text-blue-700">{selectedSlot.display}</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Account Details Option */}
                  {isAuthenticated && user ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-center">
                        <input
                          {...register('use_account_details')}
                          type="checkbox"
                          id="use_account_details"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="use_account_details" className="ml-2 block text-sm text-blue-900">
                          Use my account details ({user.name} - {user.email})
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                      <p className="text-sm text-gray-600">
                        💡 <strong>Tip:</strong> <a href="/login" className="text-blue-600 hover:text-blue-800 underline">Sign in</a> to save your details and manage your appointments easily.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...register('client_name', { required: 'Name is required' })}
                        type="text"
                        disabled={useAccountDetails}
                        className={`pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          useAccountDetails ? 'bg-gray-50 text-gray-500' : ''
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.client_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.client_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...register('client_email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        type="email"
                        disabled={useAccountDetails}
                        className={`pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          useAccountDetails ? 'bg-gray-50 text-gray-500' : ''
                        }`}
                        placeholder="Enter your email address"
                      />
                    </div>
                    {errors.client_email && (
                      <p className="mt-1 text-sm text-red-600">{errors.client_email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <ChatBubbleLeftEllipsisIcon className="inline h-4 w-4 mr-1" />
                      Comments for {provider.name} (Optional)
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Share any specific requirements, questions, or information that would help prepare for your appointment..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This message will be sent directly to {provider.name} with your booking request.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={createBookingMutation.isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-md font-medium transition-colors"
                  >
                    {createBookingMutation.isLoading ? 'Creating Booking...' : 'Confirm Booking'}
                  </button>
                </form>
              </div>
            )}

            {currentStep === 'confirmation' && (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                <p className="text-gray-600 mb-6">
                  Your appointment has been successfully booked. You&apos;ll receive a confirmation email shortly.
                </p>
                <div className="bg-gray-50 rounded-md p-4 mb-6 text-left">
                  <h3 className="font-medium text-gray-900 mb-3">Appointment Details</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Provider:</span> {provider.name}
                    </p>
                    {selectedSlot && (
                      <>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Date:</span> {TimezoneUtils.formatDateWithTimezone(selectedDate, userTimezone)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Time:</span> {selectedSlot.display}
                        </p>
                      </>
                    )}
                    {createBookingMutation.data?.appointment?.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Your Comments:</span>
                        </p>
                        <p className="text-sm text-gray-700 mt-1 italic">
                          &quot;{createBookingMutation.data.appointment.notes}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push('/providers')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                  >
                    Browse More Providers
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Provider info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-medium text-gray-900 mb-4">About {provider.name}</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <UserIcon className="h-4 w-4 mr-2" />
                  {provider.title || 'Professional Services'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  {provider.email}
                </div>
                {provider.bio && (
                  <p className="text-sm text-gray-600 mt-3">{provider.bio}</p>
                )}
              </div>
            </div>

            {/* Booking info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📅 How it works</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Select a date</li>
                <li>2. Choose an available time</li>
                <li>3. Enter your details</li>
                <li>4. Confirm your booking</li>
              </ol>
            </div>

            {/* Timezone info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">🌍 Timezone</h4>
              <p className="text-sm text-gray-600">
                Times are shown in your local timezone: 
                <br />
                <span className="font-medium">{TimezoneUtils.getTimezoneInfo(userTimezone).name}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBookingPage; 