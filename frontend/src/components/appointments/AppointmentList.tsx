import React, { useState, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { AppointmentCard } from './AppointmentCard';
import { AppointmentWithUsers } from '@/types/appointments';
import { useAuth } from '@/hooks/useAuth';

interface AppointmentListProps {
  appointments: AppointmentWithUsers[];
  isLoading?: boolean;
  onConfirm?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string, reason?: string) => void;
  onViewDetails?: (appointment: AppointmentWithUsers) => void;
  isConfirming?: boolean;
  isCancelling?: boolean;
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
type TimeFilter = 'all' | 'upcoming' | 'past' | 'today';

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  isLoading = false,
  onConfirm,
  onCancel,
  onViewDetails,
  isConfirming = false,
  isCancelling = false
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(appointment => 
        appointment.provider.name.toLowerCase().includes(term) ||
        appointment.client.name.toLowerCase().includes(term) ||
        appointment.notes?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.start_time);
        
        switch (timeFilter) {
          case 'upcoming':
            return appointmentDate >= now;
          case 'past':
            return appointmentDate < now;
          case 'today':
            return appointmentDate >= today && appointmentDate < tomorrow;
          default:
            return true;
        }
      });
    }

    // Sort by start time (upcoming first, then past in reverse order)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.start_time);
      const dateB = new Date(b.start_time);
      const now = new Date();

      const aIsUpcoming = dateA >= now;
      const bIsUpcoming = dateB >= now;

      if (aIsUpcoming && bIsUpcoming) {
        return dateA.getTime() - dateB.getTime(); // Upcoming: earliest first
      } else if (!aIsUpcoming && !bIsUpcoming) {
        return dateB.getTime() - dateA.getTime(); // Past: latest first
      } else {
        return aIsUpcoming ? -1 : 1; // Upcoming before past
      }
    });
  }, [appointments, searchTerm, statusFilter, timeFilter]);

  const getStatusCounts = () => {
    const counts = {
      all: appointments.length,
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      no_show: 0
    };

    appointments.forEach(appointment => {
      counts[appointment.status]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-6"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${user?.role === 'client' ? 'providers' : 'clients'}, notes...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All ({statusCounts.all})</option>
                  <option value="pending">Pending ({statusCounts.pending})</option>
                  <option value="confirmed">Confirmed ({statusCounts.confirmed})</option>
                  <option value="cancelled">Cancelled ({statusCounts.cancelled})</option>
                  <option value="completed">Completed ({statusCounts.completed})</option>
                  <option value="no_show">No Show ({statusCounts.no_show})</option>
                </select>
              </div>

              {/* Time Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period
                </label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="today">Today</option>
                  <option value="past">Past</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredAppointments.length} of {appointments.length} appointments
        </p>
        
        {(searchTerm || statusFilter !== 'all' || timeFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTimeFilter('all');
            }}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Appointment Cards */}
      {filteredAppointments.length > 0 ? (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onConfirm={onConfirm}
              onCancel={onCancel}
              onViewDetails={onViewDetails}
              isConfirming={isConfirming}
              isCancelling={isCancelling}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No appointments found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' || timeFilter !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : user?.role === 'provider'
              ? 'Your clients will see appointments here once they book with you.'
              : 'You haven\'t booked any appointments yet.'
            }
          </p>
          
          {user?.role === 'provider' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                <p className="text-sm text-blue-800">
                  Share your booking link with clients to start receiving appointments.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 