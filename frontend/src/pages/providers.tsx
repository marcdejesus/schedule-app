// frontend/src/pages/providers.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { 
  ProviderCard, 
  ProviderSearch, 
  ProviderEmptyState, 
  HowItWorks 
} from '@/components/providers';
import { useProviders } from '@/hooks/useProviders';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types/auth';
import { toast } from 'react-hot-toast';

const ProvidersPage: React.FC = () => {
  const { data: providers, isLoading, error } = useProviders();
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter providers based on search term
  const filteredProviders = providers?.filter((provider: User) =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleBookWithProvider = (providerId: number) => {
    // Navigate to booking page for specific provider
    router.push(`/book/${providerId}`);
  };

  const handleViewProfile = (providerId: number) => {
    // Navigate to provider profile/details page
    router.push(`/providers/${providerId}`);
  };

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-4">
              Error loading providers: {error.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold leading-tight text-gray-900">
                Find a Provider
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Browse our network of qualified providers and book your appointment today.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {filteredProviders.length} Provider{filteredProviders.length !== 1 ? 's' : ''} Available
              </span>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <ProviderSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProviders.length === 0 && (
          <ProviderEmptyState searchTerm={searchTerm} />
        )}

        {/* Providers Grid */}
        {!isLoading && filteredProviders.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map((provider: User) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onBookAppointment={handleBookWithProvider}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>
        )}

        {/* How It Works Section */}
        {!isLoading && filteredProviders.length > 0 && (
          <HowItWorks />
        )}
      </div>
    </Layout>
  );
};

export default ProvidersPage; 