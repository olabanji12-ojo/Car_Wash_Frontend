import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import { toast } from 'sonner';

const CallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            console.log('🔵 [CallbackPage] Token found in URL, attempting login...');
            // Ideally, decode the token to get user info if not provided separately
            // For now, we manually reconstruct a minimal user object or fetch it
            // Since we don't have the user object here, we can rely on the token 
            // and let the AuthContext/ProtectedRoute fetch 'me' or valid state.
            // However, our AuthContext.login expects { user, token }. 

            // Let's decode the token to get minimal user info
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const decoded = JSON.parse(jsonPayload);
                console.log('✅ [CallbackPage] Token decoded:', decoded);

                const user = {
                    id: decoded.user_id,
                    email: decoded.email,
                    role: decoded.role,
                    account_type: decoded.account_type,
                    name: decoded.name || 'User', // Fallback if name isn't in token claims
                    carwash_id: decoded.carwash_id
                };

                login({ user, token });
                toast.success('Successfully logged in with Google!');

                // Redirect based on role
                if (user.role === 'business_owner') {
                    navigate('/business-dashboard');
                } else {
                    navigate('/dashboard');
                }

            } catch (error) {
                console.error('❌ [CallbackPage] Token decoding failed:', error);
                toast.error('Login failed: Invalid token');
                navigate('/login');
            }

        } else {
            console.error('❌ [CallbackPage] No token found in URL');
            toast.error('Google Login failed. Please try again.');
            navigate('/login');
        }
    }, [searchParams, navigate, login]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600 font-medium">Completing login...</p>
        </div>
    );
};

export default CallbackPage;
