import { Routes, Route, useNavigate } from "react-router-dom"; // 👈 1. Added useNavigate
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { CarwashList } from "@/components/dashboard/CarwashList";
import MyBookingsPage from "./MyBookings";
import Vehicles from "./Vehicles";
import Favorites from "./Favorites";
import { BrowseCarwashesPage } from "@/components/dashboard/BrowseCarwashesPage"; // 👈 2. Import new page

import { useState, useEffect } from "react";
// Assuming CarwashService exports Carwash type
import CarwashService, { Carwash, PaginatedCarwashes } from "@/Contexts/CarwashService"; 
import { toast } from "sonner";

import BookingService from "@/Contexts/BookingService";
import { useFavorites } from "@/Contexts/FavoritesContext";

// Define the interface to match your backend response structure


const DASHBOARD_PREVIEW_LIMIT = 10; 

const DashboardHome = () => {
    // 3. Initialize the navigation hook
    const navigate = useNavigate();

    const [carwashes, setCarwashes] = useState<Carwash[]>([]);
    const [loading, setLoading] = useState(true);
    const { favorites } = useFavorites();
    const [stats, setStats] = useState({
        upcomingBookings: 0,
        totalVisits: 0,
        rewardsPoints: 0
    });

    // Initial fetch
    useEffect(() => {
        fetchDashboardCarwashes();
        fetchDashboardStats();
    }, []);

    const fetchDashboardCarwashes = () => {
        setLoading(true);
        // CRITICAL FIX: Ensure CarwashService.getAllCarwashes expects pagination parameters
        CarwashService.getAllCarwashes(1, DASHBOARD_PREVIEW_LIMIT)
            .then((response: PaginatedCarwashes) => {
                // FIX 4: Access the inner 'data' array from the response object
                if (response && response.data) {
                    setCarwashes(response.data);
                } else {
                    setCarwashes([]);
                }
            })
            .catch((err) => {
                console.error("Failed to fetch carwashes", err);
                toast.error("Failed to load carwashes");
                setCarwashes([]); // Ensure state is empty on error
            })
            .finally(() => setLoading(false));
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await BookingService.getMyBookings();
            // ... (stats logic remains the same)
            const bookings = Array.isArray(response) ? response : [];
            const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
            const visits = bookings.filter(b => b.status === 'completed').length;

            setStats({
                upcomingBookings: upcoming,
                totalVisits: visits,
                rewardsPoints: visits * 10
            });
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        }
    };

    const handleSearch = (lat: number, lng: number) => {
        setLoading(true);
        CarwashService.searchNearby(lat, lng)
            .then((data) => {
                const carwashesArray = Array.isArray(data) ? data : [];
                setCarwashes(carwashesArray);
                toast.success(`Found ${carwashesArray.length} carwash${carwashesArray.length !== 1 ? 'es' : ''} nearby`);
            })
            .catch((err) => {
                console.error("Search failed", err);
                toast.error("Failed to search nearby carwashes");
                setCarwashes([]);
            })
            .finally(() => setLoading(false));
    };

    // 5. Define the navigation handler
    const handleViewAll = () => {
        navigate('browse-all'); // Navigates to /dashboard/browse-all
    };

    return (
        <div className="space-y-8">
            <QuickActions onSearch={handleSearch} />
            <DashboardStats stats={{ ...stats, favoriteCarwashes: favorites.length }} />
            {/* 6. Pass the handler to the child component */}
            <CarwashList 
                carwashes={carwashes} 
                loading={loading} 
                onViewAll={handleViewAll} // 👈 CONNECTION ESTABLISHED
            />
        </div>
    );
};

const Dashboard = () => {
    return (
        <DashboardLayout>
            <Routes>
                <Route index element={<DashboardHome />} />
                {/* 7. Add the new route */}
                <Route path="browse-all" element={<BrowseCarwashesPage />} /> 
                <Route path="bookings" element={<MyBookingsPage />} />
                <Route path="favorites" element={<Favorites />} />
                <Route path="vehicles" element={<Vehicles />} />
            </Routes>
        </DashboardLayout>
    );
};

export default Dashboard;