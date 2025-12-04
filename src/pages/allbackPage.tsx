import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../Contexts/AuthContext';

const CallbackPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/auth/user', { withCredentials: true });
        login({ user: response.data.user });
        toast.success('Logged in with Google', { style: { color: '#10B981' } });
        navigate(
          response.data.user.role === 'car_owner' ? '/customer/dashboard' :
          response.data.user.role === 'business_owner' ? '/business/dashboard' :
          response.data.user.role === 'worker' ? '/worker/dashboard' :
          '/admin/dashboard'
        );
      } catch (error) {
        toast.error('Google login failed');
        navigate('/login');
      }
    };
    fetchUser();
  }, [login, navigate]);

  return <div>Loading...</div>;
};

export default CallbackPage;