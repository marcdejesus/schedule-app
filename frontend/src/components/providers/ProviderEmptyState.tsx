import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';

interface ProviderEmptyStateProps {
  searchTerm?: string;
}

export const ProviderEmptyState: React.FC<ProviderEmptyStateProps> = ({ searchTerm }) => {
  return (
    <div className="text-center py-12">
      <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No providers found</h3>
      <p className="mt-1 text-sm text-gray-500">
        {searchTerm
          ? `No providers match "${searchTerm}". Try a different search term.`
          : 'No providers are currently available.'}
      </p>
    </div>
  );
}; 