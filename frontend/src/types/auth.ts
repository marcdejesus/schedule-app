export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'provider' | 'client';
  created_at?: string;
  updated_at?: string;
  appointment_count?: number;
  available_for_booking?: boolean;
  verified?: boolean;
  rating?: number;
  specialties?: string[];
  timezone?: string;
  bio?: string;
  years_of_experience?: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'provider' | 'client';
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  revalidate: () => Promise<User | null>;
  handleOAuthCallback: (token: string, signupData?: { role?: string }) => Promise<User>;
}

export interface ProvidersResponse {
  data: User[];
  meta: {
    total_count: number;
    page: number;
    per_page: number;
  };
}

export interface ProviderResponse {
  data: User;
} 