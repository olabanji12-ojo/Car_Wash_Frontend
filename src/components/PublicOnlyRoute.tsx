import { Navigate } from 'react-router-dom';
import { useAuth } from '@/Contexts/AuthContext';
import { ReactNode } from 'react';

interface PublicOnlyRouteProps {
    children: ReactNode;
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

export const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
    const { user, isLoading } = useAuth();

    // ⏳ WAIT: If still loading user data, show nothing
    if (isLoading) {
        console.log('⏳ PublicOnlyRoute: Waiting for user data to load...');
        return null;
    }

    // If user is logged in, redirect to their home page
    if (user) {
        const userHomePage = getRoleHomePage(user.role);
        console.log(
            `🔄 PublicOnlyRoute: User "${user.email}" is already logged in`,
            `\n   → Redirecting to: ${userHomePage}`
        );
        return <Navigate to={userHomePage} replace />;
    }

    // No user logged in, show the public page (login/signup)
    console.log('✅ PublicOnlyRoute: No user logged in, showing public page');
    return <>{children}</>;
};
