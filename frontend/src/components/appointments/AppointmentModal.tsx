import React, { useState } from 'react';
import { 
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { AppointmentWithUsers } from '@/types/appointments';
import { TimezoneUtils } from '@/lib/timezone';
import { useAuth } from '@/hooks/useAuth';

interface AppointmentModalProps {
  appointment: AppointmentWithUsers;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string, reason?: string) => void;
  isConfirming?: boolean;
  isCancelling?: boolean;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  no_show: 'bg-gray-100 text-gray-800 border-gray-200'
};

const statusLabels = {
  pending: 'Pending Confirmation',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No Show'
};

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  isConfirming = false,
  isCancelling = false
}) => {
  const { user } = useAuth();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const isProvider = user?.role === 'provider';
  const isClient = user?.role === 'client';
  const isAdmin = user?.role === 'admin';

  const canConfirm = (isProvider || isAdmin) && appointment.status === 'pending';
  const canCancel = (isProvider || isClient || isAdmin) && 
    (appointment.status === 'pending' || appointment.status === 'confirmed');

  const handleCancel = () => {
    if (onCancel) {
      onCancel(appointment.id, cancelReason || undefined);
      setShowCancelModal(false);
      setCancelReason('');
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(appointment.id);
      onClose();
    }
  };

  const formatDateTime = (dateTime: string) => {
    return TimezoneUtils.formatDateWithTimezone(dateTime);
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return TimezoneUtils.formatTimeRange(startTime, endTime);
  };

  const getDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  };

  const isPastAppointment = new Date(appointment.start_time) < new Date();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Appointment Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[appointment.status]}`}>
                {statusLabels[appointment.status]}
              </span>
              
              {appointment.created_at && (
                <span className="text-sm text-gray-500">
                  Booked {TimezoneUtils.formatDateWithTimezone(appointment.created_at)}
                </span>
              )}
            </div>

            {/* Date and Time */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(appointment.start_time)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium text-gray-900">
                      {formatTimeRange(appointment.start_time, appointment.end_time)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Duration: {getDuration(appointment.start_time, appointment.end_time)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Provider */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Provider
                </h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{appointment.provider.name}</p>
                  {appointment.provider.email && (
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      {appointment.provider.email}
                    </div>
                  )}
                  {(appointment.provider as any).phone && (
                    <div className="flex items-center mt-1 text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      {(appointment.provider as any).phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Client */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Client
                </h3>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{appointment.client.name}</p>
                  {appointment.client.email && (
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      {appointment.client.email}
                    </div>
                  )}
                  {(appointment.client as any).phone && (
                    <div className="flex items-center mt-1 text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      {(appointment.client as any).phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            {(appointment as any).location && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 flex items-center mb-2">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  Location
                </h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-900">{(appointment as any).location}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {appointment.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 flex items-center mb-2">
                  <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
                  Notes
                </h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-900">{appointment.notes}</p>
                </div>
              </div>
            )}

            {/* Cancellation Reason */}
            {appointment.status === 'cancelled' && appointment.cancellation_reason && (
              <div>
                <h3 className="text-sm font-medium text-red-900 flex items-center mb-2">
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Cancellation Reason
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800">{appointment.cancellation_reason}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isPastAppointment && (canConfirm || canCancel) && (
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={isCancelling}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Appointment'}
                </button>
              )}
              
              {canConfirm && (
                <button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isConfirming ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cancel Appointment
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Please provide a reason for cancellation..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 