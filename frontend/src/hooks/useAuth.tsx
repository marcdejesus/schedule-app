import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { User, AuthContextType, LoginData, RegisterData } from '@/types/auth';
import { authApi, tokenStorage, AuthError } from '@/lib/auth';
import { toast } from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const revalidatingRef = useRef(false);

  console.log('useAuth - State:', { 
    isAuthenticated: !!user, 
    isLoading, 
    isInitialized, 
    hasToken: !!token,
    revalidating: revalidatingRef.current 
  });

  const isAuthenticated = !!user && !!token && isInitialized;

  // Debug logging for auth state changes
  useEffect(() => {
    console.log('useAuth - State changed:', { 
      hasUser: !!user, 
      hasToken: !!token, 
      isLoading, 
      isInitialized, 
      isAuthenticated 
    });
  }, [user, token, isLoading, isInitialized, isAuthenticated]);

  const revalidate = useCallback(async () => {
    // Prevent multiple simultaneous revalidation calls
    if (revalidatingRef.current) {
      console.log('useAuth: revalidate already in progress, skipping');
      return null;
    }

    console.log('useAuth: revalidate called');
    revalidatingRef.current = true;
    
    try {
      const storedToken = tokenStorage.get();
      console.log('useAuth: Checking stored token:', storedToken ? 'found' : 'not found');
      if (storedToken) {
        console.log('useAuth: Found stored token. Fetching user.');
        setIsLoading(true);
        
        try {
          const userData = await authApi.getCurrentUser(storedToken);
          console.log('useAuth: Got user data', userData);
          setUser(userData);
          setToken(storedToken);
          return userData;
        } catch (error) {
          console.error('useAuth: Failed to revalidate user:', error);
          
          // Only show error toast if it's not a 401 (invalid token)
          if (error instanceof AuthError && error.status !== 401) {
            toast.error('Session validation failed. Please log in again.');
          }
          
          // Clear invalid token
          console.log('useAuth: Clearing invalid token and user data');
          setUser(null);
          setToken(null);
          tokenStorage.remove();
          return null;
        }
      } else {
        console.log('useAuth: No stored token found.');
        setUser(null);
        setToken(null);
        return null;
      }
    } catch (error) {
      console.error('useAuth: Unexpected error during revalidation:', error);
      // Clear everything on unexpected errors
      setUser(null);
      setToken(null);
      tokenStorage.remove();
      return null;
    } finally {
      setIsLoading(false);
      setIsInitialized(true); // Mark as initialized regardless of success/failure
      revalidatingRef.current = false;
      console.log('useAuth: revalidate finished, isInitialized set to true');
    }
  }, []);

  // Load user from token on mount
  useEffect(() => {
    // Wrap revalidate in an async function to properly handle the promise
    const initializeAuth = async () => {
      try {
        await revalidate();
      } catch (error) {
        // This catch block ensures no unhandled promise rejections
        console.error('useAuth: Error during initialization:', error);
        // Ensure we're marked as initialized even on error
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (data: LoginData) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(data);
      
      console.log('useAuth: Login successful, setting user and token');
      setUser(response.user);
      setToken(response.token);
      setIsInitialized(true);
      tokenStorage.set(response.token);
      
      toast.success(response.message || 'Login successful!');
    } catch (error) {
      const message = error instanceof AuthError ? error.message : 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(data);
      
      setUser(response.user);
      setToken(response.token);
      setIsInitialized(true);
      tokenStorage.set(response.token);
      
      toast.success(response.message || 'Registration successful!');
    } catch (error) {
      const message = error instanceof AuthError ? error.message : 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOAuthCallback = async (token: string, signupData?: { role?: string }) => {
    try {
      setIsLoading(true);
      
      // First, verify the OAuth token with our backend
      const response = await authApi.verifyOAuthToken(token, signupData);
      
      // If we get a valid response, set user and token
      setUser(response.user);
      setToken(response.token);
      setIsInitialized(true);
      tokenStorage.set(response.token);
      
      toast.success('Authentication successful!');
      return response.user;
    } catch (error) {
      const message = error instanceof AuthError ? error.message : 'OAuth authentication failed';
      toast.error(message);
      tokenStorage.remove();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('useAuth: logout called');
    setUser(null);
    setToken(null);
    tokenStorage.remove();
    revalidatingRef.current = false; // Reset revalidation flag
    // Keep isInitialized as true - we're still initialized, just not authenticated
    
    // Don't show toast if user is null (silent logout due to invalid token)
    if (user) {
      toast.success('Logged out successfully');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated,
    isInitialized,
    revalidate,
    updateUser: revalidate,
    handleOAuthCallback
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 