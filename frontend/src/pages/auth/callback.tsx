import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import Head from 'next/head';

export default function OAuthCallback() {
  const router = useRouter();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'processing' | 'success' | 'error'>('loading');
  
  useEffect(() => {
    // Only proceed when router is ready
    if (!router.isReady) return;
    
    const { token, error, signup } = router.query;
    const isSignup = signup === 'true';
    
    console.log('OAuth Callback - Query params:', { token: token ? `${token.toString().substring(0, 20)}...` : 'none', error, signup });
    
    if (error && typeof error === 'string') {
      console.log('OAuth Callback - Error in query params:', error);
      setError(error);
      setStatus('error');
      // Redirect back to login after a delay
      setTimeout(() => {
        router.push(isSignup ? '/register' : '/login');
      }, 3000);
      return;
    }

    if (!token || typeof token !== 'string') {
      // No token found, redirect to login
      console.log('OAuth Callback - No token found in query params');
      setError('No authentication token provided');
      setStatus('error');
      setTimeout(() => {
        router.push(isSignup ? '/register' : '/login');
      }, 2000);
      return;
    }

    // Prevent multiple calls by checking if we're already processing
    if (status !== 'loading') {
      console.log('OAuth Callback - Already processed, skipping. Status:', status);
      return;
    }

    console.log('OAuth Callback - Processing token:', token.substring(0, 20) + '...');

    // Get role from localStorage if this is a signup flow
    let role: string | null = null;
    if (isSignup) {
      role = localStorage.getItem('oauth_signup_role');
      // Clear it once used
      localStorage.removeItem('oauth_signup_role');
      
      if (!role) {
        setError('No role selected for signup');
        setStatus('error');
        setTimeout(() => {
          router.push('/register');
        }, 2000);
        return;
      }
    }

    // Process the OAuth token (only once)
    setStatus('processing'); // Prevent re-runs
    handleOAuthCallback(token, isSignup && role ? { role } : undefined)
      .then(() => {
        console.log('OAuth Callback - Success!');
        // Set success status
        setStatus('success');
        // Redirect to dashboard or home after a brief delay
        setTimeout(() => {
          router.push('/');
        }, 1500);
      })
      .catch((err) => {
        console.error('OAuth authentication error:', err);
        setError('Authentication failed. Please try again.');
        setStatus('error');
        // Redirect back to login after a delay
        setTimeout(() => {
          router.push(isSignup ? '/register' : '/login');
        }, 3000);
      });
  }, [router.isReady, router.query.token, router.query.error, router.query.signup, status]);

  return (
    <>
      <Head>
        <title>Authentication {status === 'loading' ? 'in progress' : status === 'success' ? 'successful' : 'failed'}</title>
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        {status === 'error' ? (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error || 'Authentication error'}
            <p className="text-sm mt-2">Redirecting you...</p>
          </div>
        ) : status === 'success' ? (
          <>
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Authentication successful!
            </div>
            <p className="text-sm mt-2 text-gray-500">Redirecting you...</p>
          </>
        ) : (
          <>
            <h2 className="text-center text-xl font-medium text-gray-900 mb-4">
              Completing authentication...
            </h2>
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </>
        )}
      </div>
    </>
  );
} 