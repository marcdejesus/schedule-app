import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useAccessibility } from '@/hooks/useAccessibility';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { SpecialtiesManager } from '@/components/profile/SpecialtiesManager';
import { AccessibilityPanel } from '@/components/profile/AccessibilityPanel';
import { Avatar } from '@/components/ui/Avatar';
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
  const { user, updateUser, token, revalidate, isLoading: authLoading, isAuthenticated, isInitialized } = useAuth();
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
    console.log('Settings: User context changed:', {
      hasUser: !!user,
      userId: user?.id,
      userName: user?.name,
      avatarUrl: user?.avatar_url,
      avatarUrlFull: user?.avatar_url_full
    });
    
    if (user) {
      console.log('Settings: Updating profileData from user context:', user);
      const newProfileData = {
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        specialties: user.specialties || [],
        social_links: user.social_links_parsed || {},
        custom_booking_slug: user.custom_booking_slug || '',
        avatar_url: user.avatar_url_full || ''
      };
      console.log('Settings: New profile data:', newProfileData);
      setProfileData(newProfileData);
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
    console.log('=== Avatar Upload Debug Start ===');
    console.log('Upload initiated with file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    
    console.log('Current auth state:', {
      hasUser: !!user,
      userId: user?.id,
      hasToken: !!token,
      tokenLength: token?.length
    });
    
    if (!user || !token) {
      console.error('Avatar upload failed: Missing user or token');
      console.log('=== Avatar Upload Debug End (Auth Missing) ===');
      return;
    }

    console.log('Creating FormData...');
    const formData = new FormData();
    formData.append('avatar', file);
    
    // Log FormData contents (for debugging)
    console.log('FormData created. Checking contents:');
    Array.from(formData.entries()).forEach(([key, value]) => {
      if (value instanceof File) {
        console.log(`FormData[${key}]:`, {
          name: value.name,
          size: value.size,
          type: value.type
        });
      } else {
        console.log(`FormData[${key}]:`, value);
      }
    });

    console.log('Making API request to:', `/api/v1/users/${user.id}/avatar`);
    console.log('Request headers will include Authorization with token length:', token.length);

    try {
      console.log('Sending fetch request...');
      const response = await fetch(`/api/v1/users/${user.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      });

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });

      if (response.ok) {
        console.log('Response OK, parsing JSON...');
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.data && data.data.attributes) {
          const serverUser = data.data.attributes;
          console.log('Server user data:', {
            id: serverUser.id,
            name: serverUser.name,
            avatar_url: serverUser.avatar_url,
            avatar_url_full: serverUser.avatar_url_full
          });
        } else {
          console.warn('Response data missing expected structure:', data);
        }
        
        console.log('Calling updateUser to refresh auth context...');
        await updateUser();
        console.log('updateUser completed successfully');
        console.log('=== Avatar Upload Debug End (Success) ===');
      } else {
        console.error('Response not OK, parsing error...');
        let errorData;
        try {
          errorData = await response.json();
          console.error('Error response data:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          const textResponse = await response.text();
          console.error('Error response text:', textResponse);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}`, details: textResponse };
        }
        console.log('=== Avatar Upload Debug End (Response Error) ===');
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      console.log('=== Avatar Upload Debug End (Exception) ===');
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

  const handleAvatarDebug = async () => {
    if (!user || !token) {
      console.error('Cannot debug avatar: missing user or token');
      return;
    }

    console.log('=== Avatar Debug Utility ===');
    try {
      const response = await fetch(`/api/v1/users/${user.id}/avatar/debug`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Avatar Debug Response:', data);
        
        // Test avatar URL accessibility
        const avatarUrl = data.debug_info?.generated_avatar_url;
        if (avatarUrl) {
          console.log('Testing avatar URL accessibility:', avatarUrl);
          try {
            const avatarResponse = await fetch(avatarUrl, { method: 'HEAD' });
            console.log('Avatar URL test result:', {
              status: avatarResponse.status,
              statusText: avatarResponse.statusText,
              ok: avatarResponse.ok,
              url: avatarResponse.url
            });
            
            alert(`Avatar Debug Info:\n${JSON.stringify(data.debug_info, null, 2)}\n\nURL Test: ${avatarResponse.ok ? 'PASS' : 'FAIL'} (${avatarResponse.status})`);
          } catch (urlError) {
            console.error('Avatar URL test failed:', urlError);
            alert(`Avatar Debug Info:\n${JSON.stringify(data.debug_info, null, 2)}\n\nURL Test: FAILED (${urlError instanceof Error ? urlError.message : String(urlError)})`);
          }
        } else {
          alert(`Avatar Debug Info:\n${JSON.stringify(data.debug_info, null, 2)}\n\nNo avatar URL found!`);
        }
      } else {
        const errorData = await response.json();
        console.error('Avatar debug failed:', errorData);
        alert(`Debug failed: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Avatar debug error:', error);
      alert(`Debug error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleFullAvatarDebug = async () => {
    console.log('=== COMPREHENSIVE AVATAR DEBUG ===');
    
    // 1. Check current state
    console.log('1. Current State:', {
      hasUser: !!user,
      userId: user?.id,
      userAvatarUrl: user?.avatar_url,
      userAvatarUrlFull: user?.avatar_url_full,
      profileDataAvatarUrl: profileData.avatar_url,
      isAuthenticated,
      hasToken: !!token
    });

    if (!user || !token) {
      alert('Cannot debug: No user or token');
      return;
    }

    try {
      // 2. Get fresh user data from backend
      console.log('2. Fetching fresh user data...');
      const userResponse = await fetch(`/api/v1/sessions/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userResponse.ok) {
        alert(`User fetch failed: ${userResponse.status}`);
        return;
      }

      const userData = await userResponse.json();
      console.log('Fresh user data:', userData);

      // 3. Get avatar debug info from backend
      console.log('3. Getting avatar debug info...');
      const avatarDebugResponse = await fetch(`/api/v1/users/${user.id}/avatar/debug`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!avatarDebugResponse.ok) {
        alert(`Avatar debug failed: ${avatarDebugResponse.status}`);
        return;
      }

      const avatarDebugData = await avatarDebugResponse.json();
      console.log('Avatar debug data:', avatarDebugData);

      const generatedUrl = avatarDebugData.debug_info?.generated_avatar_url;
      const userContextUrl = userData.data?.attributes?.avatar_url_full;

      // 4. Test the generated URL directly
      if (generatedUrl) {
        console.log('4. Testing generated URL:', generatedUrl);
        try {
          const urlTestResponse = await fetch(generatedUrl);
          console.log('Generated URL test result:', {
            status: urlTestResponse.status,
            ok: urlTestResponse.ok,
            url: urlTestResponse.url,
            contentType: urlTestResponse.headers.get('content-type')
          });
        } catch (error) {
          console.error('Generated URL test failed:', error);
        }
      }

      // 5. Test the user context URL
      if (userContextUrl && userContextUrl !== generatedUrl) {
        console.log('5. Testing user context URL:', userContextUrl);
        try {
          const contextUrlTestResponse = await fetch(userContextUrl);
          console.log('User context URL test result:', {
            status: contextUrlTestResponse.status,
            ok: contextUrlTestResponse.ok,
            url: contextUrlTestResponse.url,
            contentType: contextUrlTestResponse.headers.get('content-type')
          });
        } catch (error) {
          console.error('User context URL test failed:', error);
        }
      }

      // 6. Force auth revalidation
      console.log('6. Forcing auth revalidation...');
      try {
        const revalidatedUser = await revalidate();
        console.log('Revalidated user:', revalidatedUser);
      } catch (error) {
        console.error('Revalidation failed:', error);
      }

      // 7. Show comprehensive results
      const results = {
        backend_avatar_attached: avatarDebugData.debug_info?.avatar_attached,
        backend_generated_url: generatedUrl,
        user_context_url: userContextUrl,
        profile_data_url: profileData.avatar_url,
        urls_match: generatedUrl === userContextUrl,
        context_profile_match: userContextUrl === profileData.avatar_url
      };

      console.log('Final results:', results);
      alert(`COMPREHENSIVE AVATAR DEBUG:\n${JSON.stringify(results, null, 2)}`);

    } catch (error) {
      console.error('Comprehensive debug failed:', error);
      alert(`Debug failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleAvatarUrlTest = async () => {
    const avatarUrl = profileData.avatar_url;
    if (!avatarUrl) {
      alert('No avatar URL found in profile data');
      return;
    }

    console.log('=== Avatar URL Test ===');
    console.log('Testing URL:', avatarUrl);
    
    try {
      const response = await fetch(avatarUrl, { method: 'HEAD' });
      console.log('Avatar URL test result:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      alert(`Avatar URL Test:\nURL: ${avatarUrl}\nResult: ${response.ok ? 'SUCCESS' : 'FAILED'}\nStatus: ${response.status} ${response.statusText}\nActual URL: ${response.url}`);
    } catch (error) {
      console.error('Avatar URL test failed:', error);
      alert(`Avatar URL Test FAILED:\nURL: ${avatarUrl}\nError: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleAuthDebug = async () => {
    console.log('=== Auth State Debug ===');
    console.log('useAuth state:', {
      hasUser: !!user,
      userId: user?.id,
      hasToken: !!token,
      tokenLength: token?.length,
      authLoading,
      isAuthenticated,
      isInitialized
    });
    
    // Check localStorage directly
    const storedToken = localStorage.getItem('auth_token');
    console.log('localStorage token:', storedToken ? `${storedToken.substring(0, 20)}...` : 'none');
    
    // Try manual token validation
    if (storedToken) {
      try {
        console.log('Testing stored token with manual API call...');
        const response = await fetch('/api/v1/sessions/current', {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Manual token test result:', data);
          
          // If we got valid user data but auth context is empty, try to trigger revalidation
          if (data.data?.attributes && !user) {
            console.log('Found valid user data but auth context is empty. Triggering revalidation...');
            try {
              const revalidatedUser = await revalidate();
              console.log('Revalidation completed. New user:', revalidatedUser);
              alert(`Auth Fixed!\nRevalidation successful\nUser: ${revalidatedUser?.name || 'N/A'}\nAvatar: ${revalidatedUser?.avatar_url_full || 'N/A'}`);
            } catch (err) {
              console.error('Revalidation failed:', err);
              alert(`Revalidation Failed: ${err instanceof Error ? err.message : String(err)}`);
            }
          } else {
            alert(`Auth Debug:\nHas User: ${!!user}\nHas Token: ${!!token}\nStored Token: Yes\nManual Validation: Success\nUser: ${data.data?.attributes?.name || 'N/A'}\nAvatar: ${data.data?.attributes?.avatar_url_full || 'N/A'}`);
          }
        } else {
          const errorData = await response.json();
          console.error('Manual token test failed with response:', errorData);
          alert(`Manual Token Test Failed: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        console.error('Manual token test failed:', err);
        alert(`Manual Token Test Failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      alert(`Auth Debug:\nHas User: ${!!user}\nHas Token: ${!!token}\nStored Token: No\nIssue: No token in localStorage`);
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
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-gray-900">Profile Picture</h2>
                    <div className="flex gap-1">
                      <button
                        onClick={handleAuthDebug}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                        title="Debug authentication state"
                      >
                        Auth
                      </button>
                      <button
                        onClick={handleAvatarDebug}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                        title="Debug avatar backend info"
                      >
                        Backend
                      </button>
                      <button
                        onClick={handleFullAvatarDebug}
                        className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                        title="Comprehensive avatar URL test"
                      >
                        Debug
                      </button>
                      <button
                        onClick={async () => {
                          console.log('Force refreshing avatar...');
                          try {
                            await revalidate();
                            console.log('Avatar refresh completed');
                            alert('Avatar refreshed! Check if it appears now.');
                          } catch (error) {
                            console.error('Avatar refresh failed:', error);
                            alert(`Refresh failed: ${error instanceof Error ? error.message : String(error)}`);
                          }
                        }}
                        className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                        title="Force refresh avatar from backend"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                  <AvatarUpload
                    currentAvatarUrl={user?.avatar_url_full || user?.avatar_url}
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

                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Avatar URL Debug Information</h3>
                  <div className="text-xs text-yellow-700 space-y-1">
                    <div><strong>User Context Avatar URL:</strong> {user?.avatar_url || 'null'}</div>
                    <div><strong>User Context Avatar URL Full:</strong> {user?.avatar_url_full || 'null'}</div>
                    <div><strong>Profile Data Avatar URL:</strong> {profileData.avatar_url || 'null'}</div>
                    <div><strong>Auth State:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
                    <div><strong>Has Token:</strong> {!!token ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleAuthDebug}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                      title="Debug authentication state"
                    >
                      Auth
                    </button>
                    <button
                      onClick={handleAvatarDebug}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                      title="Debug avatar backend info"
                    >
                      Backend
                    </button>
                    <button
                      onClick={handleFullAvatarDebug}
                      className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                      title="Comprehensive avatar URL test"
                    >
                      Debug
                    </button>
                    <button
                      onClick={async () => {
                        console.log('Force refreshing avatar...');
                        try {
                          await revalidate();
                          console.log('Avatar refresh completed');
                          alert('Avatar refreshed! Check if it appears now.');
                        } catch (error) {
                          console.error('Avatar refresh failed:', error);
                          alert(`Refresh failed: ${error instanceof Error ? error.message : String(error)}`);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                      title="Force refresh avatar from backend"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Current Avatar Display</h3>
                  <div className="flex items-center gap-4">
                                          <Avatar 
                        src={user?.avatar_url_full || user?.avatar_url || profileData.avatar_url} 
                        alt={user?.name || 'User'} 
                        size="lg"
                        showLoadingState={true}
                      />
                    <div className="text-xs text-blue-700">
                      <div><strong>Avatar src prop:</strong> {user?.avatar_url_full || user?.avatar_url || profileData.avatar_url || 'null'}</div>
                    </div>
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