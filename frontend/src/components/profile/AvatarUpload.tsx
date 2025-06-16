import React, { useState, useRef } from 'react';
import { UserIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  onUpload, 
  onRemove, 
  isLoading = false,
  className = '' 
}: AvatarUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      await onUpload(file);
      setPreviewUrl(null);
    } catch (error) {
      setPreviewUrl(null);
      alert('Failed to upload avatar. Please try again.');
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const handleRemove = async () => {
    if (window.confirm('Are you sure you want to remove your avatar?')) {
      try {
        await onRemove();
        setPreviewUrl(null);
      } catch (error) {
        alert('Failed to remove avatar. Please try again.');
      }
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Avatar Display */}
      <div className="relative">
        <div 
          className={`w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-50 ${
            dragOver ? 'border-blue-400 bg-blue-50' : ''
          } ${isLoading ? 'opacity-50' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Profile avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <UserIcon className="w-16 h-16" aria-hidden="true" />
            </div>
          )}
        </div>
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          aria-label="Upload new avatar"
        >
          <PhotoIcon className="w-4 h-4 mr-2" aria-hidden="true" />
          {currentAvatarUrl ? 'Change Avatar' : 'Upload Avatar'}
        </button>

        {currentAvatarUrl && (
          <button
            onClick={handleRemove}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            aria-label="Remove current avatar"
          >
            <TrashIcon className="w-4 h-4 mr-2" aria-hidden="true" />
            Remove
          </button>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="sr-only"
        aria-label="Select avatar image file"
      />

      {/* Drag and Drop Instructions */}
      <p className="text-sm text-gray-500 text-center max-w-xs">
        Click to upload or drag and drop an image. Maximum file size: 5MB.
        Supported formats: JPG, PNG, GIF.
      </p>
    </div>
  );
} 