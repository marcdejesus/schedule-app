import React, { useState } from 'react';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { AppointmentWithUsers } from '@/types/appointments';
import { TimezoneUtils } from '@/lib/timezone';
import { useAuth } from '@/hooks/useAuth';

interface AppointmentCardProps {
  appointment: AppointmentWithUsers;
  onConfirm?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string, reason?: string) => void;
  onViewDetails?: (appointment: AppointmentWithUsers) => void;
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
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No Show'
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onConfirm,
  onCancel,
  onViewDetails,
  isConfirming = false,
  isCancelling = false
}) => {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

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
    }
  };

  const formatDateTime = (dateTime: string) => {
    return TimezoneUtils.formatDateWithTimezone(dateTime);
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return TimezoneUtils.formatTimeRange(startTime, endTime);
  };

  const isPastAppointment = new Date(appointment.start_time) < new Date();

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[appointment.status]}`}>
                {statusLabels[appointment.status]}
              </span>
              
              {/* Actions Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                </button>
                
                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onViewDetails?.(appointment);
                          setShowActions(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        View Details
                      </button>
                      
                      {canConfirm && (
                        <button
                          onClick={() => {
                            onConfirm?.(appointment.id);
                            setShowActions(false);
                          }}
                          disabled={isConfirming}
                          className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50"
                        >
                          {isConfirming ? 'Confirming...' : 'Confirm'}
                        </button>
                      )}
                      
                      {canCancel && (
                        <button
                          onClick={() => {
                            setShowCancelModal(true);
                            setShowActions(false);
                          }}
                          disabled={isCancelling}
                          className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {isCancelling ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date and Time */}
            <div className="flex items-center text-gray-900 mb-2">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="font-medium">
                {formatDateTime(appointment.start_time)}
              </span>
            </div>

            <div className="flex items-center text-gray-600 mb-3">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span>{formatTimeRange(appointment.start_time, appointment.end_time)}</span>
            </div>

            {/* Participants */}
            <div className="space-y-2 mb-3">
              {isClient ? (
                <div className="flex items-center text-gray-700">
                  <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Provider:</span> {appointment.provider.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-gray-700">
                  <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Client:</span> {appointment.client.name}
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="flex items-start text-gray-600">
                <ChatBubbleLeftIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                <span className="text-sm">{appointment.notes}</span>
              </div>
            )}

            {/* Cancellation Reason */}
            {appointment.status === 'cancelled' && appointment.cancellation_reason && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <span className="font-medium">Cancellation reason:</span> {appointment.cancellation_reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {!isPastAppointment && (canConfirm || canCancel) && (
          <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
            {canConfirm && (
              <button
                onClick={() => onConfirm?.(appointment.id)}
                disabled={isConfirming}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                {isConfirming ? 'Confirming...' : 'Confirm'}
              </button>
            )}
            
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={isCancelling}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                {isCancelling ? 'Cancelling...' : 'Cancel'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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