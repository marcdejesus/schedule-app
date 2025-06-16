import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { Layout } from '@/components/layout/Layout';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { AppointmentModal } from '@/components/appointments/AppointmentModal';
import { useAppointments } from '@/hooks/useAppointments';
import { useAuth } from '@/hooks/useAuth';
import { AppointmentWithUsers } from '@/types/appointments';
import { 
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithUsers | null>(null);
  const [showModal, setShowModal] = useState(false);

  const {
    appointments,
    isLoading,
    confirmAppointment,
    cancelAppointment,
    isConfirming,
    isCancelling
  } = useAppointments();

  const handleViewDetails = (appointment: AppointmentWithUsers) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
  };

  // Calculate stats
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    upcoming: appointments.filter(a => 
      new Date(a.start_time) > new Date() && 
      (a.status === 'pending' || a.status === 'confirmed')
    ).length
  };

  const getPageTitle = () => {
    switch (user?.role) {
      case 'provider':
        return 'My Appointments';
      case 'client':
        return 'My Bookings';
      case 'admin':
        return 'All Appointments';
      default:
        return 'Appointments';
    }
  };

  const getPageDescription = () => {
    switch (user?.role) {
      case 'provider':
        return 'Manage your client appointments and availability';
      case 'client':
        return 'View and manage your booked appointments';
      case 'admin':
        return 'Manage all appointments across the platform';
      default:
        return 'Manage appointments';
    }
  };

  return (
    <>
      <Head>
        <title>{getPageTitle()} - ScheduleEase</title>
        <meta name="description" content={getPageDescription()} />
      </Head>

      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {getPageTitle()}
            </h1>
            <p className="mt-2 text-gray-600">
              {getPageDescription()}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.confirmed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.upcoming}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions for Providers */}
          {user?.role === 'provider' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-blue-900">
                    Share Your Booking Link
                  </h3>
                  <p className="text-blue-700 mt-1">
                    Let clients book appointments with you directly
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const bookingUrl = `${window.location.origin}/book/${user.id}`;
                      navigator.clipboard.writeText(bookingUrl);
                      // You could add a toast notification here
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      const bookingUrl = `${window.location.origin}/book/${user.id}`;
                      window.open(bookingUrl, '_blank');
                    }}
                    className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 text-sm font-medium"
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Appointment List */}
          <AppointmentList
            appointments={appointments}
            isLoading={isLoading}
            onConfirm={(appointmentId) => confirmAppointment(appointmentId)}
            onCancel={(appointmentId, reason) => cancelAppointment({ appointmentId, reason })}
            onViewDetails={handleViewDetails}
            isConfirming={isConfirming}
            isCancelling={isCancelling}
          />

          {/* Appointment Detail Modal */}
          {selectedAppointment && (
            <AppointmentModal
              appointment={selectedAppointment}
              isOpen={showModal}
              onClose={handleCloseModal}
              onConfirm={(appointmentId) => confirmAppointment(appointmentId)}
              onCancel={(appointmentId, reason) => cancelAppointment({ appointmentId, reason })}
              isConfirming={isConfirming}
              isCancelling={isCancelling}
            />
          )}
        </div>
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // This ensures the page is only accessible to authenticated users
  // The actual authentication check happens in the Layout component
  return {
    props: {}
  };
}; 