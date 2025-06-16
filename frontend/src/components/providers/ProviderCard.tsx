import React from 'react';
import { User } from '@/types/auth';
import { 
  ClockIcon,
  UserIcon,
  CalendarIcon,
  StarIcon,
  MapPinIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

interface ProviderCardProps {
  provider: User;
  onBookAppointment: (providerId: number) => void;
  onViewProfile: (providerId: number) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onBookAppointment,
  onViewProfile
}) => {
  return (
    <div className="bg-white overflow-hidden shadow-sm ring-1 ring-gray-900/5 rounded-xl hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Provider Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {provider.name}
              </h3>
              {provider.verified && (
                <CheckBadgeIcon className="h-5 w-5 text-blue-500" title="Verified Provider" />
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">
              {provider.email}
            </p>
            {provider.rating && (
              <div className="flex items-center mt-1">
                <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">
                  {provider.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Provider Details */}
        <div className="space-y-3 mb-6">
          {provider.available_for_booking && (
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-green-700">Available for booking</span>
            </div>
          )}
          
          {provider.appointment_count !== undefined && (
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>{provider.appointment_count} appointments completed</span>
            </div>
          )}
          
          {provider.timezone && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>{provider.timezone}</span>
            </div>
          )}
          
          {provider.years_of_experience && (
            <div className="flex items-center text-sm text-gray-600">
              <StarIcon className="h-4 w-4 mr-2 text-gray-400" />
              <span>{provider.years_of_experience} years experience</span>
            </div>
          )}
        </div>

        {/* Specialties */}
        {provider.specialties && provider.specialties.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {provider.specialties.slice(0, 3).map((specialty, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                >
                  {specialty}
                </span>
              ))}
              {provider.specialties.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
                  +{provider.specialties.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => onBookAppointment(provider.id)}
            disabled={!provider.available_for_booking}
            className={`w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors duration-200 ${
              provider.available_for_booking
                ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {provider.available_for_booking ? 'Book Appointment' : 'Currently Unavailable'}
          </button>
          <button
            onClick={() => onViewProfile(provider.id)}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}; 