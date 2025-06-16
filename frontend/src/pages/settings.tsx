import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useAccessibility } from '@/hooks/useAccessibility';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { SpecialtiesManager } from '@/components/profile/SpecialtiesManager';
import { AccessibilityPanel } from '@/components/profile/AccessibilityPanel';
import { 
  Cog6ToothIcon,
  BellIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  UserIcon,
  LinkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  specialties: string[];
  social_links: Record<string, string>;
  custom_booking_slug: string;
  avatar_url: string;
}

interface NotificationPreferences {
  email_notifications: boolean;
  appointment_reminders: boolean;
  booking_confirmations: boolean;
  notification_frequency: 'immediate' | 'daily' | 'weekly';
}

export default function SettingsPage() {
  const { user, updateUser, token, revalidate } = useAuth();
  const { preferences: accessibilityPrefs, updatePreferences: updateAccessibilityPrefs } = useAccessibility();
  
  const [profileData, setProfileData] = useState<UserProfile>({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    specialties: user?.specialties || [],
    social_links: user?.social_links_parsed || {},
    custom_booking_slug: user?.custom_booking_slug || '',
    avatar_url: user?.avatar_url_full || ''
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email_notifications: true,
    appointment_reminders: true,
    booking_confirmations: true,
    notification_frequency: 'immediate'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      console.log('Settings: Updating profileData from user context:', user);
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        specialties: user.specialties || [],
        social_links: user.social_links_parsed || {},
        custom_booking_slug: user.custom_booking_slug || '',
        avatar_url: user.avatar_url_full || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
    // Check if we have auth context, if not try to revalidate
    if (!user || !token) {
      console.error('Settings: Cannot update profile - no user or token. Current state:', { hasUser: !!user, hasToken: !!token });
      console.log('Settings: Attempting to revalidate auth state...');
      
      try {
        const revalidatedUser = await revalidate();
        if (!revalidatedUser) {
          console.error('Settings: Revalidation failed. User might need to log in again.');
          alert('Your session has expired. Please refresh the page and log in again.');
          return;
        }
        console.log('Settings: Revalidation successful, retrying profile update...');
        // Retry the update after successful revalidation
        return handleProfileUpdate(updates);
      } catch (error) {
        console.error('Settings: Revalidation error:', error);
        alert('Authentication error. Please refresh the page and log in again.');
        return;
      }
    }

    console.log('Settings: Attempting to update profile with:', updates);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: {
            ...updates,
            social_links: updates.social_links
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Settings: Profile update successful, response:', data);
        
        // Update local state with the response data from the server
        if (data.data && data.data.attributes) {
          const serverUser = data.data.attributes;
          console.log('Settings: Updating with server response:', serverUser);
          setProfileData({
            name: serverUser.name || '',
            email: serverUser.email || '',
            bio: serverUser.bio || '',
            specialties: serverUser.specialties || [],
            social_links: serverUser.social_links_parsed || {},
            custom_booking_slug: serverUser.custom_booking_slug || '',
            avatar_url: serverUser.avatar_url_full || ''
          });
        } else {
          // Fallback to updates if response doesn't have full user data
          setProfileData(prev => {
            const newData = { ...prev, ...updates };
            console.log('Settings: Updated local profileData (fallback):', newData);
            return newData;
          });
        }
        
        // Also update user context in background
        console.log('Settings: Calling updateUser to refresh auth context');
        try {
          await updateUser();
          console.log('Settings: User context updated successfully');
        } catch (error) {
          console.error('Settings: Failed to update user context:', error);
          // Don't throw - the local state update was successful
        }
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user || !token) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch(`/api/v1/users/${user.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        await updateUser();
      } else {
        throw new Error('Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const handleAvatarRemove = async () => {
    if (!user || !token) return;

    try {
      const response = await fetch(`/api/v1/users/${user.id}/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await updateUser();
      } else {
        throw new Error('Failed to remove avatar');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      throw error;
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'accessibility', name: 'Accessibility', icon: EyeIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ];

  return (
    <>
      <Head>
        <title>Settings - ScheduleEase</title>
        <meta name="description" content="Manage your account settings and preferences" />
      </Head>

      <Layout>
        {/* Skip Link for Accessibility */}
        <a 
          href="#main-content" 
          className="skip-link"
          tabIndex={0}
        >
          Skip to main content
        </a>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-600">
              Manage your account settings, preferences, and accessibility options
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8" aria-label="Settings navigation">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                >
                  <tab.icon className="w-5 h-5 inline mr-2" aria-hidden="true" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <main id="main-content" role="main">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Avatar Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Profile Picture</h2>
                  <AvatarUpload
                    currentAvatarUrl={profileData.avatar_url}
                    onUpload={handleAvatarUpload}
                    onRemove={handleAvatarRemove}
                    isLoading={isLoading}
                  />
                </div>

                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        onBlur={() => handleProfileUpdate({ name: profileData.name })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your display name"
                        aria-describedby="name-description"
                      />
                      <p id="name-description" className="text-sm text-gray-500 mt-1">
                        This is how your name will appear to others
                      </p>
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        aria-describedby="email-description"
                      />
                      <p id="email-description" className="text-sm text-gray-500 mt-1">
                        Email cannot be changed from this page
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      rows={4}
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      onBlur={() => handleProfileUpdate({ bio: profileData.bio })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell others about yourself..."
                      aria-describedby="bio-description"
                    />
                    <p id="bio-description" className="text-sm text-gray-500 mt-1">
                      A brief description that will be visible on your public profile
                    </p>
                  </div>
                </div>

                {/* Specialties (Provider only) */}
                {user?.role === 'provider' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Professional Specialties</h2>
                    <SpecialtiesManager
                      specialties={profileData.specialties}
                      onChange={(specialties) => {
                        setProfileData(prev => ({ ...prev, specialties }));
                        handleProfileUpdate({ specialties });
                      }}
                    />
                  </div>
                )}

                {/* Custom Booking URL */}
                {user?.role === 'provider' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Custom Booking URL</h2>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="booking-slug" className="block text-sm font-medium text-gray-700 mb-2">
                          Custom URL Slug
                        </label>
                        <div className="flex rounded-md shadow-sm">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            scheduleease.com/book/
                          </span>
                          <input
                            id="booking-slug"
                            type="text"
                            value={profileData.custom_booking_slug}
                            onChange={(e) => setProfileData(prev => ({ ...prev, custom_booking_slug: e.target.value }))}
                            onBlur={() => handleProfileUpdate({ custom_booking_slug: profileData.custom_booking_slug })}
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="your-name"
                            pattern="[a-z0-9\-_]+"
                            aria-describedby="booking-slug-description"
                          />
                        </div>
                        <p id="booking-slug-description" className="text-sm text-gray-500 mt-1">
                          Only lowercase letters, numbers, hyphens, and underscores allowed. Minimum 3 characters.
                        </p>
                      </div>
                      {profileData.custom_booking_slug && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-800">
                            Your booking page will be available at:{' '}
                            <a 
                              href={`/book/${profileData.custom_booking_slug}`}
                              className="font-medium underline hover:no-underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              scheduleease.com/book/{profileData.custom_booking_slug}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Social Links</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['linkedin', 'website', 'twitter', 'instagram'].map((platform) => (
                      <div key={platform}>
                        <label htmlFor={platform} className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                          {platform === 'website' ? 'Website' : platform}
                        </label>
                        <input
                          id={platform}
                          type="url"
                          value={profileData.social_links[platform] || ''}
                          onChange={(e) => {
                            const newSocialLinks = { ...profileData.social_links, [platform]: e.target.value };
                            setProfileData(prev => ({ ...prev, social_links: newSocialLinks }));
                          }}
                          onBlur={() => handleProfileUpdate({ social_links: profileData.social_links })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`https://${platform === 'website' ? 'example.com' : `${platform}.com/username`}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h2>
                {/* Notification preferences content would go here */}
                <p className="text-gray-600">Notification preferences integration coming soon...</p>
              </div>
            )}

            {/* Accessibility Tab */}
            {activeTab === 'accessibility' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <AccessibilityPanel
                  preferences={accessibilityPrefs}
                  onChange={updateAccessibilityPrefs}
                />
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h2>
                {/* Security settings content would go here */}
                <p className="text-gray-600">Security settings integration coming soon...</p>
              </div>
            )}
          </main>
        </div>

        {/* Accessibility Announcements Area */}
        <div 
          id="accessibility-announcements" 
          className="sr-only" 
          role="status" 
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Dynamic accessibility announcements will be inserted here */}
        </div>
      </Layout>
    </>
  );
} 