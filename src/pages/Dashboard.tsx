import { Routes, Route, useNavigate } from "react-router-dom"; // 👈 FIX 1: Import useNavigate
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
// ❌ Note: You need to make sure CarwashList now accepts the onViewAll prop
import { CarwashList } from "@/components/dashboard/CarwashList"; 
import MyBookingsPage from "./MyBookings";
import Vehicles from "./Vehicles";
import Favorites from "./Favorites";
// 👈 FIX 2: Import the new BrowseCarwashesPage
import { BrowseCarwashesPage } from "@/components/dashboard/BrowseCarwashesPage";

import { useState, useEffect } from "react";
// FIX 3: Import PaginatedCarwashes type if you update CarwashService.getAllCarwashes signature
import CarwashService, { Carwash, PaginatedCarwashes } from "@/Contexts/CarwashService"; 
import { toast } from "sonner";

import BookingService from "@/Contexts/BookingService";
import { useFavorites } from "@/Contexts/FavoritesContext";

// Define a constant for the dashboard preview limit
const DASHBOARD_PREVIEW_LIMIT = 10; 

const DashboardHome = () => {
  // 4. Initialize the navigation hook
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
    fetchDashboardCarwashes(); // 👈 Use the dedicated function
    fetchDashboardStats();
  }, []);

  // 5. Update fetch function to match the new CarwashService signature (if you are using the new paginated method)
  const fetchDashboardCarwashes = () => {
    setLoading(true);
    // We now call getAllCarwashes with page=1 and a limit, 
    // as CarwashService.ts was updated to be paginated.
    CarwashService.getAllCarwashes(1, DASHBOARD_PREVIEW_LIMIT)
      .then((response: PaginatedCarwashes) => { // 👈 Use the PaginatedCarwashes type
        setCarwashes(response.data); // 👈 Access the data property
      })
      .catch((err) => {
        console.error("Failed to fetch carwashes", err);
        toast.error("Failed to load carwashes");
      })
      .finally(() => setLoading(false));
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await BookingService.getMyBookings();
      // ✅ FIX: Ensure bookings is an array
      const bookings = Array.isArray(response) ? response : [];

      const upcoming = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
      const visits = bookings.filter(b => b.status === 'completed').length;

      // Mock data for rewards until implemented
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

  // 6. DEFINE THE NAVIGATION HANDLER HERE!
  const handleViewAll = () => {
    navigate('browse-all'); // Navigate relative to the current route path
  };

  return (
    <div className="space-y-8">
      <QuickActions onSearch={handleSearch} />
      <DashboardStats stats={{ ...stats, favoriteCarwashes: favorites.length }} />
      {/* 7. PASS THE HANDLER TO THE CHILD COMPONENT */}
      <CarwashList carwashes={carwashes} loading={loading} onViewAll={handleViewAll} /> 
    </div>
  );
};

const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<DashboardHome />} />
        {/* 8. ADD THE NEW ROUTE */}
        <Route path="browse-all" element={<BrowseCarwashesPage />} /> 
        <Route path="bookings" element={<MyBookingsPage />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="vehicles" element={<Vehicles />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;