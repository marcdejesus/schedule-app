import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface AccessibilityPreferences {
  high_contrast: boolean;
  reduced_motion: boolean;
  screen_reader: boolean;
  font_size: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'system';
  language: string;
}

interface UseAccessibilityReturn {
  preferences: AccessibilityPreferences;
  updatePreferences: (updates: Partial<AccessibilityPreferences>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  applyAccessibilitySettings: () => void;
  announceToScreenReader: (message: string) => void;
}

const defaultPreferences: AccessibilityPreferences = {
  high_contrast: false,
  reduced_motion: false,
  screen_reader: false,
  font_size: 'medium',
  theme: 'system',
  language: 'en'
};

export function useAccessibility(): UseAccessibilityReturn {
  const { user, token } = useAuth();
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preferences from API
  const loadPreferences = useCallback(async () => {
    if (!user || !token) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/v1/users/${user.id}/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data.attributes);
      } else {
        console.warn('Could not load accessibility preferences, using defaults');
      }
    } catch (err) {
      console.warn('Error loading accessibility preferences:', err);
      setError('Failed to load accessibility preferences');
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  // Update preferences via API
  const updatePreferences = useCallback(async (updates: Partial<AccessibilityPreferences>) => {
    if (!user || !token) return;

    const newPreferences = { ...preferences, ...updates };
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/v1/users/${user.id}/preferences`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_preference: updates
        })
      });

      if (response.ok) {
        setPreferences(newPreferences);
        applyAccessibilitySettings(newPreferences);
        announceToScreenReader('Accessibility preferences updated');
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (err) {
      setError('Failed to update accessibility preferences');
      console.error('Error updating accessibility preferences:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, token, preferences]);

  // Apply accessibility settings to the DOM
  const applyAccessibilitySettings = useCallback((prefs = preferences) => {
    const root = document.documentElement;
    const body = document.body;

    // High contrast mode
    if (prefs.high_contrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (prefs.reduced_motion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${prefs.font_size}`);

    // Theme
    const prefersDark = prefs.theme === 'dark' || 
      (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Screen reader optimizations
    if (prefs.screen_reader) {
      root.classList.add('screen-reader-optimized');
      // Add more specific aria attributes
      body.setAttribute('aria-live', 'polite');
    } else {
      root.classList.remove('screen-reader-optimized');
      body.removeAttribute('aria-live');
    }

    // Language
    root.setAttribute('lang', prefs.language);
  }, [preferences]);

  // Announce messages to screen readers
  const announceToScreenReader = useCallback((message: string) => {
    const announcer = document.getElementById('accessibility-announcements');
    if (announcer) {
      announcer.textContent = message;
      // Clear the message after a brief delay to allow for re-announcements
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }, []);

  // Load preferences on mount and user change
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Apply settings when preferences change
  useEffect(() => {
    applyAccessibilitySettings();
  }, [applyAccessibilitySettings]);

  // Listen for system theme changes
  useEffect(() => {
    if (preferences.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyAccessibilitySettings();
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.theme, applyAccessibilitySettings]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + H for high contrast toggle
      if (event.altKey && event.key === 'h') {
        event.preventDefault();
        updatePreferences({ high_contrast: !preferences.high_contrast });
      }
      
      // Alt + M for reduced motion toggle
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        updatePreferences({ reduced_motion: !preferences.reduced_motion });
      }
      
      // Alt + T for theme cycling
      if (event.altKey && event.key === 't') {
        event.preventDefault();
        const themes: Array<AccessibilityPreferences['theme']> = ['light', 'dark', 'system'];
        const currentIndex = themes.indexOf(preferences.theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        updatePreferences({ theme: nextTheme });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [preferences, updatePreferences]);

  return {
    preferences,
    updatePreferences,
    isLoading,
    error,
    applyAccessibilitySettings: () => applyAccessibilitySettings(),
    announceToScreenReader
  };
} 