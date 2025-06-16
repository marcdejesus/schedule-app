import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ProviderSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export const ProviderSearch: React.FC<ProviderSearchProps> = ({
  searchTerm,
  onSearchChange,
  placeholder = "Search providers by name or email..."
}) => {
  return (
    <div className="max-w-md">
      <label htmlFor="search" className="sr-only">
        Search providers
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          id="search"
          name="search"
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
        />
      </div>
    </div>
  );
}; 