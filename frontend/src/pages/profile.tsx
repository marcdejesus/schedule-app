import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { 
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleEditProfile = () => {
    router.push('/settings');
  };

  const handleChangePassword = () => {
    // We'll create a change password modal/page
    router.push('/change-password');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'provider':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'client':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full access to manage the entire platform';
      case 'provider':
        return 'Can manage availability and appointments';
      case 'client':
        return 'Can book appointments with providers';
      default:
        return 'Standard user access';
    }
  };

  return (
    <>
      <Head>
        <title>Profile - ScheduleEase</title>
        <meta name="description" content="View and manage your profile information" />
      </Head>

      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="mt-2 text-gray-600">
              View your account information and settings
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
              <div className="flex items-center">
                <div className="bg-white rounded-full p-3">
                  <UserIcon className="h-12 w-12 text-gray-600" />
                </div>
                <div className="ml-6">
                  <h2 className="text-2xl font-bold text-white">
                    {user?.name}
                  </h2>
                                     <p className="text-blue-100">
                     Member since {(user as any)?.created_at ? new Date((user as any).created_at).toLocaleDateString() : 'N/A'}
                   </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-medium text-gray-900">{user?.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Email Address</p>
                        <p className="font-medium text-gray-900">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Account Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Account Type</p>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user?.role || '')}`}>
                            {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {getRoleDescription(user?.role || '')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">User ID</p>
                        <p className="font-medium text-gray-900 font-mono text-sm">{user?.id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Provider-specific Information */}
              {user?.role === 'provider' && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Provider Information
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">
                          Your Booking Link
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Share this link with clients to let them book appointments with you
                        </p>
                        <p className="text-sm font-mono text-blue-800 mt-2 bg-white px-2 py-1 rounded border">
                          {typeof window !== 'undefined' ? `${window.location.origin}/book/${user.id}` : `[domain]/book/${user.id}`}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            const bookingUrl = `${window.location.origin}/book/${user.id}`;
                            navigator.clipboard.writeText(bookingUrl);
                            // You could add a toast notification here
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Account Actions
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage your account settings and preferences
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleEditProfile}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Edit Profile
                    </button>
                    <button 
                      onClick={handleChangePassword}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Need Help?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Contact Support</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Have questions or need assistance? Our support team is here to help.
                </p>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Contact Support →
                </button>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Documentation</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Learn how to make the most of ScheduleEase with our comprehensive guides.
                </p>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View Docs →
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
} 