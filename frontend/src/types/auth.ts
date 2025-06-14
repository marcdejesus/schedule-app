export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'provider' | 'client';
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
  revalidate: () => Promise<User | null>;
  handleOAuthCallback: (token: string) => Promise<User>;
} 