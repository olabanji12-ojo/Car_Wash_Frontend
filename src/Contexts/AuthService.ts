import axios from 'axios';
import { toast } from 'sonner';
import API_BASE_URL from './baseUrl';

// Match the exact types from AuthContext
interface User {
  id: string;
  email: string;
  role: 'car_owner' | 'business_owner' | 'worker' | 'business_admin' | '';
  account_type: 'car_owner' | 'car_wash' | '';
  carwash_id?: string; // Business owner's carwash ID
  name?: string;
}

const AuthService = { // Now returns both user and token
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { email, password },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Safely extract data, trying common response structures.
      const responseData = response.data?.data?.data || response.data?.data || response.data;

      if (!responseData || !responseData.token || !responseData.user) {
        throw new Error('Invalid response structure from server during login');
      }

      const { token, user: userData } = responseData;

      // Ensure required fields exist
      if (!userData.id || !userData.email) {
        throw new Error('Invalid user data received');
      }

      // Map the response to match your User type
      return { // Return both user and token
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.role || '',
          account_type: userData.accountType || userData.account_type || '',
          carwash_id: userData.carwash_id || userData.carwashId,
          name: userData.name || userData.full_name
        },
        token: token
      };
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  },

  async register(
    name: string,
    email: string,
    phone: string,
    password: string,
    role: string,
    account_type: string // Now returns both user and token
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/register`,
        { name, email, phone, password, role, account_type },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Safely extract data, trying common response structures.
      const responseData = response.data?.data?.data || response.data?.data || response.data;

      if (!responseData || !responseData.token || !responseData.user) {
        throw new Error('Invalid response structure from server during registration');
      }

      const { token, user: userData } = responseData;

      // Ensure required fields exist
      if (!userData.id || !userData.email) {
        throw new Error('Invalid user data received');
      }

      // Map the response to match your User type
      return { // Return both user and token
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.role || '',
          account_type: userData.accountType || userData.account_type || '',
          carwash_id: userData.carwash_id || userData.carwashId,
          name: userData.name || userData.full_name
        },
        token: token
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      throw error;
    }

  },

  async verifyEmail(email: string, token: string): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/verify`,
        { email, token },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      toast.success('Email verified successfully!');
    } catch (error: any) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.message || 'Verification failed';
      toast.error(errorMessage);
      throw error;
    }
  },

  async resendVerificationEmail(email: string): Promise<void> {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/resend-verification`,
        { email },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      toast.success('Verification code resent! Check your email.');
    } catch (error: any) {
      console.error('Resend error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to resend code';
      toast.error(errorMessage);
      throw error;
    }
  },
};

export default AuthService;