import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuth } from '@/hooks/useAuth';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSwitchToLogin = () => {
    router.push('/login');
  };

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  if (isAuthenticated) {
    return null; // or a loading spinner
  }

  return (
    <RegisterForm 
      onSwitchToLogin={handleSwitchToLogin}
      onSuccess={handleSuccess}
    />
  );
};

export default RegisterPage; 