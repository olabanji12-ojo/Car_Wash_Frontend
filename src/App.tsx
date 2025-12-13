import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import CarwashDetails from "./pages/CarwashDetails";
import Booking from "./pages/Booking";
import Vehicles from "./pages/Vehicles";
import Profile from "./pages/Profile";
import PostOnboarding from "./Carwash/PostOnboarding";
import BusinessProfileSettings from "./Carwash/BusinessProfileSettings";
import BookingSidebar from "./components/BookingSidebar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import BusinessDashboard from "./Carwash/BusinessDashboard";
import BookingsManagement from "./Carwash/BookingsManagement";
import ReviewsManagement from "./Carwash/ReviewsManagement";
import { AuthProvider } from "./Contexts/AuthContext";
import { FavoritesProvider } from "./Contexts/FavoritesContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import BrowseCarwashesPage from "./components/dashboard/BrowseCarwashesPage";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FavoritesProvider>
            <Routes>
              {/* 🌐 PUBLIC ROUTES - Anyone can access */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
              <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
              <Route path="/verify-email" element={<PublicOnlyRoute><VerifyEmail /></PublicOnlyRoute>} />
              <Route path="/carwash/:id" element={<CarwashDetails />} />
              <Route path="/carwashes" element={<BrowseCarwashesPage />} />

              {/* 🚗 CUSTOMER-ONLY ROUTES */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute allowedRoles={['car_owner']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking"
                element={
                  <ProtectedRoute allowedRoles={['car_owner']}>
                    <Booking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vehicles"
                element={
                  <ProtectedRoute allowedRoles={['car_owner']}>
                    <Vehicles />
                  </ProtectedRoute>
                }
              />

              {/* 🏢 BUSINESS OWNER-ONLY ROUTES */}
              <Route
                path="/business-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['business_owner']}>
                    <BusinessDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/post-onboarding"
                element={
                  <ProtectedRoute allowedRoles={['business_owner']}>
                    <PostOnboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/business-profile-settings"
                element={
                  <ProtectedRoute allowedRoles={['business_owner']}>
                    <BusinessProfileSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings-management"
                element={
                  <ProtectedRoute allowedRoles={['business_owner']}>
                    <BookingsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reviews-management"
                element={
                  <ProtectedRoute allowedRoles={['business_owner']}>
                    <ReviewsManagement />
                  </ProtectedRoute>
                }
              />

              {/* 👤 SHARED ROUTES - Both roles can access */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['car_owner', 'business_owner']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* 404 - Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </FavoritesProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider >
);

export default App;