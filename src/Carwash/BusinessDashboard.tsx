import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import BookingService, { BookingResponse } from "@/Contexts/BookingService";
import CarwashService from "@/Contexts/CarwashService";
import { useAuth } from "@/Contexts/AuthContext";
import { toast } from "sonner";
import {
  Calendar,
  DollarSign,
  Star,
  Bell,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  User,
  MapPin,
  Clock,
  Menu,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data
const mockMetrics = {
  totalBookings: 0,
  revenue: 0,
  averageRating: 0,
  pendingBookings: 0,
};

const mockNotifications = [
  {
    id: "1",
    message: "New booking from John Doe for Exterior Wash",
    unread: true,
    type: "new-booking",
  },
  {
    id: "2",
    message: "Customer Jane Smith left a 5-star review",
    unread: false,
    type: "review",
  },
  {
    id: "3",
    message: "Pending home service request from Alice Johnson",
    unread: true,
    type: "pending",
  },
];

const mockChartData = [
  { name: 'Week 1', bookings: 5, revenue: 30000 },
  { name: 'Week 2', bookings: 8, revenue: 48000 },
  { name: 'Week 3', bookings: 6, revenue: 36000 },
  { name: 'Week 4', bookings: 7, revenue: 42000 },
];

const BusinessDashboard = () => {
  const [metrics, setMetrics] = useState(mockMetrics);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      // 🔍 DEBUG: Log the entire user object
      console.log('=== BusinessDashboard Debug ===');
      console.log('1. Full user object:', user);
      console.log('2. user.carwash_id:', user?.carwash_id);
      console.log('3. typeof carwash_id:', typeof user?.carwash_id);

      // Also check localStorage directly
      const storedUser = localStorage.getItem('user');
      console.log('4. localStorage user (raw):', storedUser);
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          console.log('5. localStorage user (parsed):', parsed);
          console.log('6. localStorage carwash_id:', parsed.carwash_id);
        } catch (e) {
          console.error('Failed to parse localStorage user:', e);
        }
      }
      console.log('==============================');

      // Check if user has a carwash_id (business owner)
      if (!user?.carwash_id) {
        console.error('❌ No carwash_id found in user object');
        toast.error("No carwash found for this account");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('✅ Fetching carwash with ID:', user.carwash_id);

        // 1. Get carwash details
        const myCarwash = await CarwashService.getCarwashById(user.carwash_id);
        console.log('✅ Carwash fetched:', myCarwash);

        // 2. Get bookings for this carwash
        const fetchedBookings = await BookingService.getBookingsByCarwash(user.carwash_id);
        console.log('✅ Raw bookings response:', fetchedBookings);
        console.log('✅ Is array?', Array.isArray(fetchedBookings));
        console.log('✅ Type:', typeof fetchedBookings);

        // ✅ SAFETY: Ensure bookings is always an array
        const bookingsArray = Array.isArray(fetchedBookings) ? fetchedBookings : [];
        console.log('✅ Bookings array:', bookingsArray.length, 'bookings');
        setBookings(bookingsArray);

        // 3. Calculate metrics
        const total = bookingsArray.length;
        const pending = bookingsArray.filter((b: any) => b.status === 'pending').length;
        const revenue = bookingsArray
          .filter((b: any) => b.status === 'completed' || b.status === 'confirmed')
          .reduce((acc: number, curr: any) => acc + (curr.total_price || 0), 0);

        setMetrics({
          totalBookings: total,
          revenue: revenue,
          averageRating: myCarwash.rating || 0,
          pendingBookings: pending
        });

        console.log('✅ Metrics calculated:', { total, pending, revenue });
      } catch (error) {
        console.error("❌ Failed to fetch dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleAcceptBooking = async (id: string) => {
    try {
      await BookingService.updateBookingStatus(id, "confirmed");
      setBookings(bookings.map(b => b.id === id ? { ...b, status: "confirmed" } : b));
      toast.success("Booking confirmed");
    } catch (error) {
      toast.error("Failed to confirm booking");
    }
  };

  const handleRejectBooking = async (id: string) => {
    try {
      await BookingService.updateBookingStatus(id, "cancelled");
      setBookings(bookings.map(b => b.id === id ? { ...b, status: "cancelled" } : b));
      toast.success("Booking rejected");
    } catch (error) {
      toast.error("Failed to reject booking");
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const handleViewBooking = (id: string) => {
    alert(`Viewing booking ${id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="text-orange-500 border-orange-500 text-xs">Pending</Badge>;
      case "confirmed":
        return <Badge className="bg-green-500 text-xs">Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-blue-600 text-xs">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="text-xs">Cancelled</Badge>;
      default:
        return <Badge className="text-xs">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {notifications.filter(n => n.unread).length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar - Metrics and Quick Actions */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Metrics Card */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Metric Item */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-600">Total Bookings</p>
                    <p className="text-lg sm:text-2xl font-bold">{metrics.totalBookings}</p>
                  </div>
                </div>
                <Separator />

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-600">Revenue</p>
                    <p className="text-lg sm:text-2xl font-bold">₦{metrics.revenue.toLocaleString()}</p>
                  </div>
                </div>
                <Separator />

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-600">Average Rating</p>
                    <p className="text-lg sm:text-2xl font-bold">{metrics.averageRating}/5</p>
                  </div>
                </div>
                <Separator />

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-50">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-600">Pending Bookings</p>
                    <p className="text-lg sm:text-2xl font-bold">{metrics.pendingBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <Button className="w-full justify-between text-sm sm:text-base" size="sm">
                  Manage Bookings
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button onClick={() => navigate("/reviews-management")} className="w-full justify-between text-sm sm:text-base" variant="outline" size="sm">
                  Manage Reviews
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button onClick={() => navigate("/business-profile-settings")} className="w-full justify-between text-sm sm:text-base" variant="outline" size="sm">
                  Update Profile
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button className="w-full justify-between text-sm sm:text-base" variant="outline" size="sm">
                  Add Service
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Recent Bookings - Mobile Card View */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>Customer {booking.user_id?.slice(-4)}</TableCell>
                          <TableCell className="capitalize">{booking.booking_type?.replace('_', ' ')}</TableCell>
                          <TableCell className="text-sm">{new Date(booking.booking_time).toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>
                            {booking.status === "pending" ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600"
                                  onClick={() => handleAcceptBooking(booking.id)}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600"
                                  onClick={() => handleRejectBooking(booking.id)}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewBooking(booking.id)}
                              >
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">Customer {booking.user_id?.slice(-4)}</p>
                          <p className="text-xs text-gray-600 capitalize">{booking.booking_type?.replace('_', ' ')}</p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(booking.booking_time).toLocaleString()}</span>
                      </div>
                      {booking.status === "pending" ? (
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-green-600 border-green-600 text-xs"
                            onClick={() => handleAcceptBooking(booking.id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-600 border-red-600 text-xs"
                            onClick={() => handleRejectBooking(booking.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full text-xs"
                          onClick={() => handleViewBooking(booking.id)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {bookings.length === 0 && (
                  <div className="text-center py-8 text-gray-600 text-sm">
                    No recent bookings
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                {notifications.slice(0, 3).map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-md cursor-pointer ${notif.unread ? "bg-blue-50" : ""
                      } hover:bg-gray-100`}
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm ${notif.unread ? "font-semibold" : ""}`}>
                        {notif.message}
                      </p>
                    </div>
                    {notif.unread && <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />}
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-8 text-gray-600 text-sm">
                    No notifications
                  </div>
                )}
                <Button variant="outline" className="w-full text-xs sm:text-sm" size="sm">
                  View All Notifications
                </Button>
              </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height={250} minWidth={300}>
                    <LineChart data={mockChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ fontSize: '12px' }}
                        formatter={(value: any) =>
                          typeof value === 'number' && value > 1000
                            ? `₦${value.toLocaleString()}`
                            : value
                        }
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="bookings" stroke="#2563EB" name="Bookings" strokeWidth={2} />
                      <Line type="monotone" dataKey="revenue" stroke="#10B981" name="Revenue (₦)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;