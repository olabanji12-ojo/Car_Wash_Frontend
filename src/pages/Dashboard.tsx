import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { CarwashList } from "@/components/dashboard/CarwashList";
import MyBookingsPage from "./MyBookings";
import Vehicles from "./Vehicles";

import { useState, useEffect } from "react";
import CarwashService, { Carwash } from "@/Contexts/CarwashService";
import { toast } from "sonner";

import BookingService from "@/Contexts/BookingService";

const DashboardHome = () => {
  const [carwashes, setCarwashes] = useState<Carwash[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingBookings: 0,
    favoriteCarwashes: 0,
    totalVisits: 0,
    rewardsPoints: 0
  });

  // Initial fetch
  useEffect(() => {
    fetchAllCarwashes();
    fetchDashboardStats();
  }, []);

  const fetchAllCarwashes = () => {
    setLoading(true);
    CarwashService.getAllCarwashes()
      .then((data) => {
        setCarwashes(data);
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

      // Mock data for favorites and rewards until implemented
      setStats({
        upcomingBookings: upcoming,
        favoriteCarwashes: 0, // Placeholder
        totalVisits: visits,
        rewardsPoints: visits * 10 // Simple reward logic: 10 pts per visit
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

  return (
    <div className="space-y-8">
      <QuickActions onSearch={handleSearch} />
      <DashboardStats stats={stats} />
      <CarwashList carwashes={carwashes} loading={loading} />
    </div>
  );
};

const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="bookings" element={<MyBookingsPage />} />
        <Route path="vehicles" element={<Vehicles />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;