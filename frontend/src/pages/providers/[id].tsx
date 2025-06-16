import React from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { useProvider } from '@/hooks/useProvider';
import { 
  UserIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  MapPinIcon,
  CheckBadgeIcon,
  ArrowLeftIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const ProviderDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const providerId = parseInt(id as string);
  
  const { data: provider, isLoading, error } = useProvider(providerId);

  const handleBookAppointment = () => {
    router.push(`/book/${providerId}`);
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !provider) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-4">
              {error?.message || 'Provider not found'}
            </div>
            <button
              onClick={handleGoBack}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Providers
          </button>
        </div>

        {/* Provider Header */}
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {provider.name}
                  </h1>
                  {provider.verified && (
                    <CheckBadgeIcon className="h-6 w-6 text-blue-500" title="Verified Provider" />
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    {provider.email}
                  </div>
                  {provider.timezone && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {provider.timezone}
                    </div>
                  )}
                </div>

                {provider.rating && (
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(provider.rating!)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {provider.rating.toFixed(1)} out of 5
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBookAppointment}
                    disabled={!provider.available_for_booking}
                    className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md transition-colors duration-200 ${
                      provider.available_for_booking
                        ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    }`}
                  >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    {provider.available_for_booking ? 'Book Appointment' : 'Currently Unavailable'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Provider Details */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              {provider.bio ? (
                <p className="text-gray-600 leading-relaxed">{provider.bio}</p>
              ) : (
                <p className="text-gray-500 italic">No bio available.</p>
              )}
            </div>

            {/* Specialties */}
            {provider.specialties && provider.specialties.length > 0 && (
              <div className="mt-6 bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                {provider.appointment_count !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Appointments</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {provider.appointment_count}
                    </span>
                  </div>
                )}
                
                {provider.years_of_experience && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Experience</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {provider.years_of_experience} years
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Status</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    provider.available_for_booking ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {provider.available_for_booking ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">{provider.email}</span>
                </div>
                {provider.timezone && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">{provider.timezone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProviderDetailPage; 