import React, { useState, useRef } from 'react';
import { UserIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Avatar } from '@/components/ui/Avatar';

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
    console.log('=== AvatarUpload Component Debug Start ===');
    console.log('File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    
    // Validate file type
    console.log('Validating file type...');
    if (!file.type.startsWith('image/')) {
      console.error('File validation failed: not an image file');
      console.log('=== AvatarUpload Component Debug End (Invalid Type) ===');
      alert('Please select an image file');
      return;
    }
    console.log('File type validation passed');

    // Validate file size (5MB max)
    console.log('Validating file size...');
    if (file.size > 5 * 1024 * 1024) {
      console.error('File validation failed: size too large', file.size);
      console.log('=== AvatarUpload Component Debug End (Too Large) ===');
      alert('File size must be less than 5MB');
      return;
    }
    console.log('File size validation passed');

    // Create preview
    console.log('Creating preview URL...');
    const url = URL.createObjectURL(file);
    console.log('Preview URL created:', url);
    setPreviewUrl(url);

    try {
      console.log('Calling onUpload prop...');
      await onUpload(file);
      console.log('onUpload completed successfully');
      setPreviewUrl(null);
      console.log('Preview URL cleared');
      console.log('=== AvatarUpload Component Debug End (Success) ===');
    } catch (error) {
      console.error('onUpload failed:', error);
      setPreviewUrl(null);
      console.log('Preview URL cleared due to error');
      console.log('=== AvatarUpload Component Debug End (Upload Error) ===');
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
          className={`border-4 border-gray-200 rounded-full ${
            dragOver ? 'border-blue-400 bg-blue-50' : ''
          } ${isLoading ? 'opacity-50' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Avatar 
            src={displayUrl}
            alt="Profile avatar"
            size="xl"
            showLoadingState={true}
          />
        </div>
        
        {/* Upload Loading Overlay */}
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