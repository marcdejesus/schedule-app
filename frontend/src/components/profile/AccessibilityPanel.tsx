import React from 'react';
import { 
  EyeIcon,
  SpeakerWaveIcon,
  PlayPauseIcon,
  AdjustmentsHorizontalIcon,
  UserIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';

interface AccessibilityPreferences {
  high_contrast: boolean;
  reduced_motion: boolean;
  screen_reader: boolean;
  font_size: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'system';
  language: string;
}

interface AccessibilityPanelProps {
  preferences: AccessibilityPreferences;
  onChange: (preferences: Partial<AccessibilityPreferences>) => void;
  className?: string;
}

export function AccessibilityPanel({ 
  preferences, 
  onChange, 
  className = '' 
}: AccessibilityPanelProps) {
  const handleToggle = (key: keyof AccessibilityPreferences, value: any) => {
    onChange({ [key]: value });
  };

  const FontSizeSlider = () => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Font Size
      </label>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="2"
          step="1"
          value={preferences.font_size === 'small' ? 0 : preferences.font_size === 'medium' ? 1 : 2}
          onChange={(e) => {
            const sizes = ['small', 'medium', 'large'] as const;
            handleToggle('font_size', sizes[parseInt(e.target.value)]);
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          aria-label="Font size selector"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Small</span>
          <span>Medium</span>
          <span>Large</span>
        </div>
      </div>
      <div className="text-sm text-gray-600">
        Current: <span className="font-medium">{preferences.font_size}</span>
      </div>
    </div>
  );

  const ToggleSwitch = ({ 
    id, 
    checked, 
    onChange, 
    label, 
    description, 
    icon: Icon 
  }: {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        <Icon className="w-5 h-5 text-gray-600" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor={id} className="text-sm font-medium text-gray-900 cursor-pointer">
              {label}
            </label>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <div className="ml-4">
            <button
              type="button"
              id={id}
              role="switch"
              aria-checked={checked}
              onClick={() => onChange(!checked)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                checked ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              aria-describedby={`${id}-description`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  checked ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" aria-hidden="true" />
          Accessibility Preferences
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Customize your experience to meet your accessibility needs.
        </p>
      </div>

      {/* Visual Accessibility */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center">
          <EyeIcon className="w-4 h-4 mr-2" aria-hidden="true" />
          Visual Accessibility
        </h3>

        <ToggleSwitch
          id="high-contrast"
          checked={preferences.high_contrast}
          onChange={(checked) => handleToggle('high_contrast', checked)}
          label="High Contrast Mode"
          description="Increases contrast between text and background for better readability"
          icon={EyeIcon}
        />

        <FontSizeSlider />

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Theme Preference
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light', label: 'Light', description: 'Light theme' },
              { value: 'dark', label: 'Dark', description: 'Dark theme' },
              { value: 'system', label: 'System', description: 'Follow system preference' }
            ].map((theme) => (
              <button
                key={theme.value}
                type="button"
                onClick={() => handleToggle('theme', theme.value)}
                className={`p-3 text-sm rounded-lg border text-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  preferences.theme === theme.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                aria-pressed={preferences.theme === theme.value}
                aria-label={theme.description}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Motion and Animation */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center">
          <PlayPauseIcon className="w-4 h-4 mr-2" aria-hidden="true" />
          Motion and Animation
        </h3>

        <ToggleSwitch
          id="reduced-motion"
          checked={preferences.reduced_motion}
          onChange={(checked) => handleToggle('reduced_motion', checked)}
          label="Reduce Motion"
          description="Minimizes animations and transitions that may cause discomfort"
          icon={PlayPauseIcon}
        />
      </div>

      {/* Screen Reader and Assistive Technology */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center">
          <SpeakerWaveIcon className="w-4 h-4 mr-2" aria-hidden="true" />
          Assistive Technology
        </h3>

        <ToggleSwitch
          id="screen-reader"
          checked={preferences.screen_reader}
          onChange={(checked) => handleToggle('screen_reader', checked)}
          label="Screen Reader Optimization"
          description="Optimizes the interface for screen readers and provides additional audio cues"
          icon={SpeakerWaveIcon}
        />
      </div>

      {/* Language and Localization */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-900 flex items-center">
          <LanguageIcon className="w-4 h-4 mr-2" aria-hidden="true" />
          Language
        </h3>

        <div className="space-y-3">
          <label htmlFor="language-select" className="block text-sm font-medium text-gray-700">
            Interface Language
          </label>
          <select
            id="language-select"
            value={preferences.language}
            onChange={(e) => handleToggle('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Select interface language"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="pt">Português</option>
          </select>
        </div>
      </div>

      {/* Keyboard Navigation Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Keyboard Navigation
        </h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Use Tab to navigate between elements</p>
          <p>• Use Space or Enter to activate buttons and links</p>
          <p>• Use arrow keys to navigate within menus and lists</p>
          <p>• Use Escape to close dialogs and menus</p>
        </div>
      </div>

      {/* Screen Reader Announcements Area */}
      <div 
        id="accessibility-announcements" 
        className="sr-only" 
        role="status" 
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Dynamic accessibility announcements will be inserted here */}
      </div>
    </div>
  );
} 