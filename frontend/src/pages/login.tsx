import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSwitchToRegister = () => {
    router.push('/register');
  };

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  if (isAuthenticated) {
    return null; // or a loading spinner
  }

  return (
    <LoginForm 
      onSwitchToRegister={handleSwitchToRegister}
      onSuccess={handleSuccess}
    />
  );
};

export default LoginPage; 