import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import API_BASE_URL from '../Contexts/baseUrl'
interface User {
  id: string;
  email: string;
  role: 'car_owner' | 'business_owner' | 'worker' | 'business_admin' | '';
  account_type: 'car_owner' | 'car_wash' | '';
  carwash_id?: string; // Business owner's carwash ID
  name?: string;
}

interface AuthContextType {
  user: User | null; // User object
  isLoading: boolean; // Loading state
  login: (response: { user: User; token: string }) => void; // Now expects token
  logout: () => void;
  refreshUser: () => void; // Refresh user from localStorage
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as loading
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    console.log('🔍 AuthContext: Loading user from localStorage...');

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (
          parsedUser.id &&
          parsedUser.email &&
          ['car_owner', 'business_owner', 'worker', 'business_admin'].includes(parsedUser.role) &&
          ['car_owner', 'car_wash', ''].includes(parsedUser.account_type)
        ) {
          setUser(parsedUser);
          console.log('✅ AuthContext: User loaded:', parsedUser.email, parsedUser.role);
        } else {
          // If user data is invalid, clear both
          console.warn('⚠️ AuthContext: Invalid user data, clearing...');
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('❌ AuthContext: Error loading user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    } else if (storedToken) {
      // If there's a token but no user, something is inconsistent. Clear token.
      console.warn('⚠️ AuthContext: Token exists but no user, clearing token...');
      localStorage.removeItem('authToken');
    } else {
      console.log('ℹ️ AuthContext: No user in localStorage');
    }

    setIsLoading(false); // Done loading
    console.log('✅ AuthContext: Loading complete');
  }, []);

  const refreshUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('✅ User refreshed from localStorage:', parsedUser);
      } catch (error) {
        console.error('❌ Failed to refresh user:', error);
      }
    }
  };

  const login = (response: { user: User; token: string }) => {
    try {
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('authToken', response.token); // Save the token here!

      // Check if business owner needs to complete onboarding
      if (response.user.role === 'business_owner' && !response.user.carwash_id) {
        console.log('🔄 Business owner has no carwash, redirecting to onboarding...');
        navigate('/post-onboarding');
      } else {
        // Navigate to appropriate dashboard
        navigate(
          response.user.role === 'car_owner' ? '/dashboard' :
            response.user.role === 'business_owner' ? '/business-dashboard' :
              response.user.role === 'worker' ? '/worker/dashboard' :
                '/admin/dashboard'
        );
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save session.');
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      localStorage.removeItem('authToken'); // Clear the token on logout
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;

}