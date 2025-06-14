import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useUpcomingAppointments } from '@/hooks/useAppointments';
import { 
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { TimezoneUtils } from '@/lib/timezone';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: upcomingResponse, isLoading } = useUpcomingAppointments();

  const upcomingAppointments = upcomingResponse?.data?.map(item => ({
    ...item.attributes,
    id: item.id
  })) || [];

  const nextAppointment = upcomingAppointments[0];

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${user?.name}!`;
  };

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'provider':
        return {
          title: 'Provider Dashboard',
          description: 'Manage your appointments and availability',
          quickActions: [
            {
              title: 'View Appointments',
              description: 'See all your upcoming appointments',
              href: '/appointments',
              icon: CalendarDaysIcon,
              color: 'blue'
            },
            {
              title: 'Manage Availability',
              description: 'Set your available hours',
              href: '/availability',
              icon: ClockIcon,
              color: 'green'
            },
            {
              title: 'Share Booking Link',
              description: 'Let clients book with you',
              href: `/book/${user.id}`,
              icon: UserGroupIcon,
              color: 'purple',
              external: true
            }
          ]
        };
      case 'client':
        return {
          title: 'Client Dashboard',
          description: 'View and manage your bookings',
          quickActions: [
            {
              title: 'My Bookings',
              description: 'View your scheduled appointments',
              href: '/appointments',
              icon: CalendarDaysIcon,
              color: 'blue'
            },
            {
              title: 'Book Appointment',
              description: 'Schedule a new appointment',
              href: '/providers',
              icon: PlusIcon,
              color: 'green'
            }
          ]
        };
      case 'admin':
        return {
          title: 'Admin Dashboard',
          description: 'Manage the entire platform',
          quickActions: [
            {
              title: 'All Appointments',
              description: 'View all platform appointments',
              href: '/appointments',
              icon: CalendarDaysIcon,
              color: 'blue'
            },
            {
              title: 'Manage Users',
              description: 'Manage platform users',
              href: '/admin/users',
              icon: UserGroupIcon,
              color: 'purple'
            }
          ]
        };
      default:
        return {
          title: 'Dashboard',
          description: 'Welcome to ScheduleEase',
          quickActions: []
        };
    }
  };

  const content = getRoleSpecificContent();

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
    purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
  };

  return (
    <>
      <Head>
        <title>{content.title} - ScheduleEase</title>
        <meta name="description" content={content.description} />
      </Head>

      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {getWelcomeMessage()}
            </h1>
            <p className="mt-2 text-gray-600">
              {content.description}
            </p>
          </div>

          {/* Next Appointment Card */}
          {nextAppointment && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Next Appointment
                  </h3>
                  <div className="space-y-1">
                    <p className="text-gray-600">
                      <span className="font-medium">Date:</span> {TimezoneUtils.formatDateWithTimezone(nextAppointment.start_time)}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Time:</span> {TimezoneUtils.formatTimeRange(nextAppointment.start_time, nextAppointment.end_time)}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">
                        {user?.role === 'client' ? 'Provider' : 'Client'}:
                      </span> {user?.role === 'client' ? nextAppointment.provider.name : nextAppointment.client.name}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Link
                    href="/appointments"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View Details
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {content.quickActions.map((action) => {
              const Icon = action.icon;
              const Component = action.external ? 'a' : Link;
              const props = action.external 
                ? { href: action.href, target: '_blank', rel: 'noopener noreferrer' }
                : { href: action.href };

              return (
                <Component
                  key={action.title}
                  {...props}
                  className={`block p-6 border rounded-lg transition-colors ${colorClasses[action.color as keyof typeof colorClasses]}`}
                >
                  <div className="flex items-center">
                    <Icon className="h-8 w-8 mr-4" />
                    <div>
                      <h3 className="text-lg font-medium">{action.title}</h3>
                      <p className="text-sm opacity-75">{action.description}</p>
                    </div>
                  </div>
                </Component>
              );
            })}
          </div>

          {/* Recent Activity */}
          {upcomingAppointments.length > 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Upcoming Appointments
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {upcomingAppointments.slice(1, 4).map((appointment) => (
                  <div key={appointment.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.role === 'client' ? appointment.provider.name : appointment.client.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {TimezoneUtils.formatDateWithTimezone(appointment.start_time)} at {TimezoneUtils.formatTimeRange(appointment.start_time, appointment.end_time)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 bg-gray-50 text-center">
                <Link
                  href="/appointments"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  View all appointments →
                </Link>
              </div>
            </div>
          )}

          {/* Empty State */}
          {upcomingAppointments.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No upcoming appointments
              </h3>
              <p className="text-gray-600 mb-4">
                {user?.role === 'provider' 
                  ? 'Your clients will see appointments here once they book with you.'
                  : 'You haven\'t booked any appointments yet.'
                }
              </p>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
} 