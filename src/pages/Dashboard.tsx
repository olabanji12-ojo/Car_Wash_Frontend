import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { CarwashList } from "@/components/dashboard/CarwashList";
import BrowseCarwashesPage from "@/components/dashboard/BrowseCarwashesPage";
import MyBookingsPage from "./MyBookings";
import Vehicles from "./Vehicles";
import Favorites from "./Favorites";
import NotificationsPage from "./Notifications";

import { useState, useEffect } from "react";
import CarwashService, { Carwash } from "@/Contexts/CarwashService";
import { toast } from "sonner";

import BookingService from "@/Contexts/BookingService";
import { useFavorites } from "@/Contexts/FavoritesContext";

const DashboardHome = () => {
    const [carwashes, setCarwashes] = useState<Carwash[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchedAddress, setSearchedAddress] = useState("");
    const [searchedLocation, setSearchedLocation] = useState<[number, number] | undefined>(undefined);
    const { favorites } = useFavorites();
    const [stats, setStats] = useState({
        upcomingBookings: 0,
        totalVisits: 0,
        rewardsPoints: 0
    });

    // Initial fetch
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            fetchDashboardStats();
        } else {
            // Ensure stats are zero for guest to avoid "ghost data"
            setStats({
                upcomingBookings: 0,
                totalVisits: 0,
                rewardsPoints: 0
            });
        }
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await BookingService.getMyBookings();
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
            setStats({
                upcomingBookings: 0,
                totalVisits: 0,
                rewardsPoints: 0
            });
        }
    };

    const handleSearch = (lat: number, lng: number, address: string, mode: 'station' | 'home') => {
        setLoading(true);
        setHasSearched(true);
        setSearchedAddress(address);
        setSearchedLocation([lng, lat]);

        CarwashService.searchNearby(lat, lng)
            .then((data) => {
                let carwashesArray = Array.isArray(data) ? data : [];

                // filter by home service if in home mode
                if (mode === 'home') {
                    carwashesArray = carwashesArray.filter(cw => cw.home_service === true);
                }

                // Attach search context to each carwash for specialized rendering in CarwashCard
                const extendedCarwashes = carwashesArray.map(cw => ({
                    ...cw,
                    search_mode: mode
                })) as any[];

                setCarwashes(extendedCarwashes);
                toast.success(`Found ${extendedCarwashes.length} results for ${mode === 'home' ? 'Home Service' : 'Station Visit'}`);
            })
            .catch((err) => {
                console.error("Search failed", err);
                toast.error("Failed to search nearby carwashes");
                setCarwashes([]);
            })
            .finally(() => setLoading(false));
    };

    return (
        <div className="space-y-8">
            <QuickActions onSearch={handleSearch} />
            <DashboardStats stats={{ ...stats, favoriteCarwashes: favorites.length }} />
            <CarwashList
                carwashes={carwashes}
                loading={loading}
                hasSearched={hasSearched}
                searchedAddress={searchedAddress}
                searchedLocation={searchedLocation}
            />
        </div>
    );
};

const Dashboard = () => {
    return (
        <DashboardLayout>
            <Routes>
                <Route index element={<DashboardHome />} />
                <Route path="browse" element={<BrowseCarwashesPage />} />
                <Route path="find" element={<BrowseCarwashesPage />} /> {/* Alias for find */}
                <Route path="bookings" element={<MyBookingsPage />} />
                <Route path="favorites" element={<Favorites />} />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="notifications" element={<NotificationsPage />} />
            </Routes>
        </DashboardLayout>
    );
};

export default Dashboard;