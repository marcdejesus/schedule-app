import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { authApi, AuthError } from '@/lib/auth';

export default function ConfirmEmail() {
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (token && typeof token === 'string') {
      confirmEmail(token);
    } else {
      setIsLoading(false);
      setError('No confirmation token provided');
    }
  }, [token]);

  const confirmEmail = async (confirmationToken: string) => {
    try {
      const result = await authApi.confirmEmail(confirmationToken);
      setMessage(result.message);
      setUserInfo(result.user);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
        // Allow resending if token is expired or invalid
        if (err.status === 422 || err.status === 400) {
          setCanResend(true);
        }
      } else {
        setError('An unexpected error occurred during email confirmation.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!userInfo?.email) {
      setError('Email address not available for resending confirmation.');
      return;
    }

    setResendLoading(true);
    try {
      const result = await authApi.resendEmailConfirmation(userInfo.email);
      setMessage(result.message);
      setCanResend(false);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Failed to resend confirmation email.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Confirming your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {message ? (
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          )}

          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {message ? 'Email Confirmed!' : 'Email Confirmation Failed'}
          </h2>

          {userInfo && message && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Welcome, <span className="font-medium">{userInfo.name}</span>! Your email <span className="font-medium">{userInfo.email}</span> has been confirmed.
            </p>
          )}
        </div>

        {message && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{message}</p>
                <p className="text-sm text-green-700 mt-1">Redirecting to dashboard in 3 seconds...</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {canResend && (
          <div className="space-y-4">
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    Your confirmation link may have expired. Click below to receive a new confirmation email.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleResendConfirmation}
              disabled={resendLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {resendLoading ? 'Sending...' : 'Resend Confirmation Email'}
            </button>
          </div>
        )}

        <div className="flex items-center justify-center space-x-4 text-sm">
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500 transition-colors">
            Sign in
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/register" className="text-indigo-600 hover:text-indigo-500 transition-colors">
            Create account
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500 transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 