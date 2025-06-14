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
    const handleAuthCallback = async () => {
      if (errorFromQuery) {
        setMessage(`Authentication failed: ${errorFromQuery}`);
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (tokenFromQuery) {
        tokenStorage.set(tokenFromQuery as string);
        try {
          await revalidate();
          router.push('/dashboard');
        } catch (error) {
          setMessage('Authentication failed. Redirecting to login...');
          setTimeout(() => router.push('/login'), 3000);
        }
      } else {
        // No token, redirect to login
        router.push('/login');
      }
    };

    handleAuthCallback();
  }, [tokenFromQuery, errorFromQuery, router, revalidate]);

  return <div>{message}</div>;
};

export default AuthCallbackPage; 