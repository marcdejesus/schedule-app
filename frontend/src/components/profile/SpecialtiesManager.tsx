import React, { useState, useRef } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SpecialtiesManagerProps {
  specialties: string[];
  onChange: (specialties: string[]) => void;
  placeholder?: string;
  maxSpecialties?: number;
  className?: string;
}

export function SpecialtiesManager({
  specialties,
  onChange,
  placeholder = "Enter a specialty",
  maxSpecialties = 10,
  className = ''
}: SpecialtiesManagerProps) {
  const [inputValue, setInputValue] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addSpecialty = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    // Check for duplicates (case insensitive)
    if (specialties.some(s => s.toLowerCase() === trimmedValue.toLowerCase())) {
      alert('This specialty is already added');
      return;
    }

    // Check max limit
    if (specialties.length >= maxSpecialties) {
      alert(`You can add up to ${maxSpecialties} specialties`);
      return;
    }

    onChange([...specialties, trimmedValue]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeSpecialty = (index: number) => {
    const newSpecialties = specialties.filter((_, i) => i !== index);
    onChange(newSpecialties);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSpecialty();
    } else if (event.key === 'Backspace' && !inputValue && specialties.length > 0) {
      // Remove last specialty when backspace is pressed on empty input
      removeSpecialty(specialties.length - 1);
    }
  };

  const handleTagKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeSpecialty(index);
      inputRef.current?.focus();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      const prevTag = event.currentTarget.previousElementSibling as HTMLElement;
      prevTag?.focus();
    } else if (event.key === 'ArrowRight') {
      const nextTag = event.currentTarget.nextElementSibling as HTMLElement;
      if (nextTag && nextTag.tagName === 'SPAN') {
        nextTag.focus();
      } else {
        inputRef.current?.focus();
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Specialties
        <span className="text-gray-500 ml-1">
          ({specialties.length}/{maxSpecialties})
        </span>
      </label>
      
      {/* Specialties Display */}
      <div
        className={`min-h-[42px] p-3 border rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
          inputFocused ? 'border-blue-500' : 'border-gray-300'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {specialties.map((specialty, index) => (
            <span
              key={index}
              tabIndex={0}
              role="button"
              aria-label={`Remove specialty: ${specialty}`}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-200"
              onKeyDown={(e) => handleTagKeyDown(e, index)}
            >
              {specialty}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSpecialty(index);
                }}
                className="ml-1 inline-flex items-center p-0.5 rounded-full hover:bg-blue-200 focus:outline-none focus:bg-blue-200"
                aria-label={`Remove ${specialty}`}
              >
                <XMarkIcon className="w-3 h-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          
          {/* Input Field */}
          {specialties.length < maxSpecialties && (
            <div className="flex items-center min-w-0 flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={specialties.length === 0 ? placeholder : ''}
                className="border-0 p-0 focus:ring-0 flex-1 min-w-0 text-sm placeholder-gray-400"
                aria-label="Add new specialty"
              />
              {inputValue.trim() && (
                <button
                  type="button"
                  onClick={addSpecialty}
                  className="ml-1 inline-flex items-center p-1 rounded-full text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Add specialty"
                >
                  <PlusIcon className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="text-sm text-gray-500 space-y-1">
        <p>Add your professional specialties or areas of expertise.</p>
        <p>Press Enter to add a specialty, or click the + button.</p>
        {specialties.length === maxSpecialties && (
          <p className="text-amber-600">
            You've reached the maximum number of specialties.
          </p>
        )}
      </div>

      {/* Popular Specialties Suggestions */}
      {specialties.length < maxSpecialties && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Popular specialties:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'General Consultation',
              'Medical Checkup',
              'Therapy Session',
              'Business Coaching',
              'Legal Consultation',
              'Financial Planning'
            ]
              .filter(suggestion => !specialties.some(s => s.toLowerCase() === suggestion.toLowerCase()))
              .slice(0, 6)
              .map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    if (specialties.length < maxSpecialties) {
                      onChange([...specialties, suggestion]);
                    }
                  }}
                  className="inline-flex items-center px-2 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Add suggested specialty: ${suggestion}`}
                >
                  <PlusIcon className="w-3 h-3 mr-1" aria-hidden="true" />
                  {suggestion}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
} 