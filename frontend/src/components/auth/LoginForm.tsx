import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { LoginData } from '@/types/auth';
import { useRouter } from 'next/router';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSuccess }) => {
  const { login, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string>('');
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>();

  // Handle OAuth error in query params (but not token - that's handled by callback page)
  useEffect(() => {
    const { error } = router.query;
    
    if (error && typeof error === 'string') {
      setServerError(error);
      router.replace(router.pathname);
    }
  }, [router.query, router]);

  const onSubmit = async (data: LoginData) => {
    try {
      setServerError('');
      await login(data);
      onSuccess?.();
    } catch (error) {
      setServerError('Invalid email or password');
    }
  };

  const handleGoogleSignIn = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Don't pass a custom redirect_uri - let OmniAuth use the default
    window.location.href = `${apiUrl}/users/auth/google_oauth2`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </button>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {serverError}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                type="password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <img 
                src="https://developers.google.com/identity/images/g-logo.png" 
                alt="Google logo" 
                className="h-5 w-5 mr-2"
              />
              Sign in with Google
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Demo accounts:
            </p>
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              <p>Admin: admin@scheduleease.com / password</p>
              <p>Provider: provider@scheduleease.com / password</p>
              <p>Client: client@scheduleease.com / password</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}; 