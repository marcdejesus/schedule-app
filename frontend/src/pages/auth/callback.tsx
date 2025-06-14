import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { tokenStorage } from '@/lib/auth';

const AuthCallbackPage = () => {
  const router = useRouter();
  const { token: tokenFromQuery, error: errorFromQuery } = router.query;
  const { revalidate } = useAuth();
  const [message, setMessage] = useState('Authenticating...');

  useEffect(() => {
    console.log('AuthCallbackPage: router.query', router.query);
    const handleAuthCallback = async () => {
      if (errorFromQuery) {
        console.error('AuthCallbackPage: Authentication failed with error:', errorFromQuery);
        setMessage(`Authentication failed: ${errorFromQuery}`);
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (tokenFromQuery) {
        console.log('AuthCallbackPage: Token found in query params:', tokenFromQuery);
        tokenStorage.set(tokenFromQuery as string);
        try {
          console.log('AuthCallbackPage: Revalidating user session...');
          await revalidate();
          console.log('AuthCallbackPage: Revalidation successful, redirecting to dashboard.');
          router.push('/dashboard');
        } catch (error) {
          console.error('AuthCallbackPage: Revalidation failed.', error);
          setMessage('Authentication failed. Redirecting to login...');
          setTimeout(() => router.push('/login'), 3000);
        }
      } else {
        // No token, redirect to login
        console.log('AuthCallbackPage: No token or error found, redirecting to login.');
        router.push('/login');
      }
    };

    handleAuthCallback();
  }, [tokenFromQuery, errorFromQuery, router, revalidate]);

  return <div>{message}</div>;
};

export default AuthCallbackPage; 