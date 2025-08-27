import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/services/api';

export type UserRole = 'learner' | 'trainer' | 'evaluator';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
}

interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  resetToken: string;
  newPassword: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('telugu-basics-token');
    const savedUser = localStorage.getItem('telugu-basics-user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // Enable token verification for live deployment
        console.log('AuthContext - Verifying authentication token...');
        
        // First check if server is reachable
        apiService.checkServerConnectivity()
          .then((isConnected) => {
            if (isConnected) {
              // Server is reachable, verify token
              return apiService.getCurrentUser();
            } else {
              console.warn('AuthContext - Server not reachable, using local data');
              throw new Error('Server not reachable');
            }
          })
          .then((response) => {
            console.log('AuthContext - Token verified successfully');
            setUser(response.data);
          })
          .catch((error) => {
            console.warn('AuthContext - Token verification failed:', error.message);
            // Only clear if it's a specific authentication error
            if (error.message.includes('Invalid token') || error.message.includes('Access denied') || error.message.includes('No token provided')) {
              console.log('AuthContext - Clearing invalid authentication data');
              localStorage.removeItem('telugu-basics-token');
              localStorage.removeItem('telugu-basics-user');
              setUser(null);
            } else {
              console.log('AuthContext - Keeping local data for network/server issues');
            }
          });
      } catch (error) {
        console.error('AuthContext - Error parsing saved user:', error);
        localStorage.removeItem('telugu-basics-token');
        localStorage.removeItem('telugu-basics-user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await apiService.login(credentials);
      
      setUser(response.data.user);
      
      // Wait a moment for localStorage to be updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify token is stored
      const token = localStorage.getItem('telugu-basics-token');
      console.log('AuthContext - Token after login:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.error('AuthContext - Token not stored after login!');
        console.log('AuthContext - Response data:', response);
        throw new Error('Token not stored after login');
      }
      
      // Redirect based on role
      const userRole = response.data.user.role;
      if (userRole === 'trainer') {
        window.location.href = '/trainer';
      } else if (userRole === 'evaluator') {
        window.location.href = '/evaluator';
      } else if (userRole === 'learner') {
        window.location.href = '/learner';
      } else {
        // Default fallback
        window.location.href = '/';
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
          apiService.logout().catch(console.error);
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await apiService.register(userData);
      setUser(response.data.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    try {
      await apiService.forgotPassword(data);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordData) => {
    setIsLoading(true);
    try {
      await apiService.resetPassword(data);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
