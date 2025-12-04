import { Navigate } from 'react-router-dom';
import { useAuth } from '@/Contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles: string[]; // e.g., ['car_owner', 'business_owner']
    redirectTo?: string;
}

// Helper function to get the home page for each role
const getRoleHomePage = (role: string): string => {
    switch (role) {
        case 'car_owner':
            return '/dashboard';
        case 'business_owner':
            return '/business-dashboard';
        case 'worker':
            return '/worker-dashboard';
        case 'business_admin':
            return '/admin-dashboard';
        default:
            return '/';
    }
};

export const ProtectedRoute = ({
    children,
    allowedRoles,
    redirectTo
}: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();

    // ⏳ WAIT: If still loading user data, show nothing (or a loader)
    if (isLoading) {
        console.log('⏳ ProtectedRoute: Waiting for user data to load...');
        return null; // Or return a loading spinner component
    }

    // If no user is logged in, redirect to login
    if (!user) {
        console.warn('🚫 ProtectedRoute: No user logged in, redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    // If user's role is not in the allowed roles, redirect to their home page
    if (!allowedRoles.includes(user.role)) {
        const userHomePage = redirectTo || getRoleHomePage(user.role);
        console.warn(
            `🚫 ProtectedRoute: Access denied for role "${user.role}"`,
            `\n   Allowed roles:`, allowedRoles,
            `\n   → Redirecting to: ${userHomePage}`
        );
        return <Navigate to={userHomePage} replace />;
    }

    // User has the correct role, render the protected content
    console.log(`✅ ProtectedRoute: Access granted for role "${user.role}"`);
    return <>{children}</>;
};
