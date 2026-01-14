import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
  Clock,
  AlertCircle,
  Truck,
  Share2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import NotificationService from "@/Contexts/NotificationService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUpdateBookingStatus } from "@/hooks/useBookings";
import { BookingDetailsModal } from "@/components/dashboard/BookingDetailsModal";
import WorkerService, { Worker } from "@/Contexts/WorkerService";
import { WorkerCard } from "@/components/dashboard/WorkerCard";
import { AddWorkerModal } from "@/components/dashboard/AddWorkerModal";
import { EditWorkerModal } from "@/components/dashboard/EditWorkerModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";

// Chart data remains mock for now as it's a presentation element
const mockChartData = [
  { name: 'Week 1', bookings: 5, revenue: 30000 },
  { name: 'Week 2', bookings: 8, revenue: 48000 },
  { name: 'Week 3', bookings: 6, revenue: 36000 },
  { name: 'Week 4', bookings: 7, revenue: 42000 },
];

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateStatusMutation = useUpdateBookingStatus();

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
  const [isEditWorkerModalOpen, setIsEditWorkerModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Fetch Notifications with Polling
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => NotificationService.getMyNotifications(),
    refetchInterval: 5000,
  });

  // Fetch Dashboard Data (Metrics & Recent Bookings)
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["business-dashboard", user?.carwash_id],
    queryFn: async () => {
      if (!user?.carwash_id) return null;

      const myCarwash = await CarwashService.getCarwashById(user.carwash_id);
      const fetchedBookings = await BookingService.getBookingsByCarwash(user.carwash_id);
      const bookingsArray = Array.isArray(fetchedBookings) ? fetchedBookings : [];

      const total = bookingsArray.length;
      const pending = bookingsArray.filter((b: any) => b.status === 'pending').length;
      const revenue = bookingsArray
        .filter((b: any) => b.status === 'completed' || b.status === 'confirmed')
        .reduce((acc: number, curr: any) => acc + (curr.total_price || 0), 0);

      return {
        bookings: bookingsArray,
        metrics: {
          totalBookings: total,
          revenue: revenue,
          averageRating: myCarwash.rating || 0,
          pendingBookings: pending
        }
      };
    },
    enabled: !!user?.carwash_id,
    refetchInterval: 5000,
  });

  const { data: workers = [], refetch: refetchWorkers } = useQuery({
    queryKey: ["workers", user?.carwash_id],
    queryFn: async () => {
      if (!user?.carwash_id) return [];
      const data = await WorkerService.getWorkers(user.carwash_id);
      return data;
    },
    enabled: !!user?.carwash_id,
  });

  const bookings = dashboardData?.bookings || [];
  const metrics = dashboardData?.metrics || { totalBookings: 0, revenue: 0, averageRating: 0, pendingBookings: 0 };

  // Real-time tracking for "en_route" bookings (Step 2: The Producer)
  useEffect(() => {
    const enRouteBookings = bookings.filter((b: any) => b.status === "en_route" && b.booking_type === "home_service");

    if (enRouteBookings.length === 0) return;

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    console.info("🛰️ Provider Tracking Active:", enRouteBookings.length, "booking(s)");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Batch updates to backend
        enRouteBookings.forEach((booking: any) => {
          BookingService.updateWorkerLocation(booking.id, latitude, longitude);
        });
      },
      (error) => console.error("🛰️ GPS Error:", error.message),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [dashboardData?.bookings]); // Only re-run if bookings list changes

  const markReadMutation = useMutation({
    mutationFn: (id: string) => NotificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const handleAcceptBooking = (id: string) => {
    updateStatusMutation.mutate({ id, status: "confirmed" });
  };

  const handleRejectBooking = (id: string) => {
    updateStatusMutation.mutate({ id, status: "cancelled" });
  };

  const handleUpdateStatus = (id: string, status: string, code?: string) => {
    const booking = bookings.find((b: any) => b.id === id);
    if (status === "completed" && booking?.booking_type === "home_service" && !code) {
      const promptCode = window.prompt("Please enter the customer's 4-digit verification code to complete this home service:");
      if (!promptCode) {
        toast.error("Verification code is required to complete home service.");
        return;
      }
      updateStatusMutation.mutate({ id, status, code: promptCode });
      return;
    }
    updateStatusMutation.mutate({ id, status, code });
  };

  const handleAssignWorker = async (bookingId: string, workerId: string) => {
    try {
      await WorkerService.assignWorker(bookingId, workerId);
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["carwash-bookings"] });
      toast.success("Worker assigned successfully");
    } catch (err) {
      toast.error("Failed to assign worker");
    }
  };

  const handleMarkAsRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const handleViewBooking = (booking: any) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleEditWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsEditWorkerModalOpen(true);
  };

  const handleUpdateWorker = async (id: string, data: Partial<Worker>) => {
    try {
      await WorkerService.updateWorker(id, data);
      refetchWorkers();
      toast.success("Worker updated successfully");
    } catch (err) {
      toast.error("Failed to update worker");
      throw err;
    }
  };

  const handleUpdateWorkerPhoto = async (id: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          toast.loading("Uploading photo...");
          await WorkerService.uploadWorkerPhoto(id, file);
          refetchWorkers();
          toast.dismiss();
          toast.success("Photo updated successfully");
        } catch (err) {
          toast.dismiss();
          toast.error("Failed to upload photo");
        }
      }
    };
    input.click();
  };

  const getServiceBadge = (type: string) => {
    return type === 'home_service'
      ? <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50 text-[10px] h-5 uppercase">Home</Badge>
      : <Badge variant="outline" className="text-gray-600 border-gray-600 bg-gray-50 text-[10px] h-5 uppercase">On-site</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-bold px-2 py-0.5">Pending</Badge>;
      case "confirmed":
        return <Badge className="bg-primary hover:bg-primary/90 text-white font-bold px-2 py-0.5 shadow-sm">Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-0.5 shadow-sm">Completed</Badge>;
      case "en_route":
        return <Badge className="bg-accent hover:bg-accent/90 text-white font-bold px-2 py-0.5 animate-pulse shadow-md">🚚 En Route</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="font-bold px-2 py-0.5 shadow-sm">Cancelled</Badge>;
      default:
        return <Badge className="font-bold px-2 py-0.5">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 font-outfit">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="workers">Workers Hub</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex items-center gap-1 font-medium">
                <Clock className="h-3 w-3" />
                Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            </div>
          </div>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Sidebar - Metrics and Quick Actions */}
              <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm transition-all hover:bg-primary/10">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary/70 uppercase tracking-wider">Total Bookings</p>
                          <p className="text-3xl font-black text-foreground">{metrics.totalBookings}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-accent/5 border border-accent/10 shadow-sm transition-all hover:bg-accent/10">
                        <div className="p-3 rounded-xl bg-accent/10">
                          <DollarSign className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-accent/70 uppercase tracking-wider">Revenue</p>
                          <p className="text-3xl font-black text-foreground">₦{metrics.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="hidden lg:block py-2"><Separator className="bg-border/50" /></div>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-50 border border-yellow-100 shadow-sm transition-all hover:bg-yellow-100/50">
                        <div className="p-3 rounded-xl bg-yellow-400/20">
                          <Star className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-yellow-700/70 uppercase tracking-wider">Avg Rating</p>
                          <p className="text-3xl font-black text-foreground">{metrics.averageRating}/5</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 border border-orange-100 shadow-sm transition-all hover:bg-orange-100/50">
                        <div className="p-3 rounded-xl bg-orange-400/20">
                          <AlertCircle className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-orange-700/70 uppercase tracking-wider">Pending</p>
                          <p className="text-3xl font-black text-foreground">{metrics.pendingBookings}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    <Button onClick={() => navigate("/bookings-management")} className="w-full justify-between text-sm sm:text-base" size="sm">
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
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="pb-3 sm:pb-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base sm:text-lg">Recent Bookings</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 text-xs gap-1"
                      onClick={() => navigate("/bookings-management")}
                    >
                      View All <ChevronRight className="h-3 w-3" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="hidden md:block overflow-x-auto -mx-6 px-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Verification</TableHead>
                            <TableHead>Date/Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bookings.slice(0, 5).map((booking: any) => (
                            <TableRow key={booking.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">Customer {booking.user_id?.slice(-4)}</span>
                                  <p className="text-[10px] text-muted-foreground uppercase">{booking.car_id?.slice(-6)}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {getServiceBadge(booking.booking_type)}
                                  {booking.booking_type === 'home_service' && booking.address_note && (
                                    <p className="text-[10px] text-muted-foreground italic truncate max-w-[120px]" title={booking.address_note}>
                                      {booking.address_note}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {booking.booking_type === 'home_service' ? (
                                    <>
                                      <span className="font-mono font-bold text-primary bg-primary/5 px-2 py-1 rounded border">
                                        {booking.verification_code || "----"}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-blue-600"
                                        title="Copy Magic Tracking Link"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const link = `${window.location.origin}/track/${booking.id}`;
                                          navigator.clipboard.writeText(link);
                                          toast.success("Tracking link copied!");
                                        }}
                                      >
                                        <Share2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Badge variant="outline" className="font-bold border-primary text-primary bg-primary/5 px-2 py-1">
                                      Q #{booking.queue_number || "---"}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="flex flex-col">
                                  <span>{new Date(booking.booking_time).toLocaleDateString()}</span>
                                  <span className="text-blue-600 font-semibold">{new Date(booking.booking_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(booking.status)}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {booking.status === "pending" ? (
                                    <>
                                      <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => handleAcceptBooking(booking.id)}>Accept</Button>
                                      <Button size="sm" variant="outline" className="text-red-600 border-red-600" onClick={() => handleRejectBooking(booking.id)}>Reject</Button>
                                    </>
                                  ) : booking.status === "confirmed" && booking.booking_type === "home_service" ? (
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleUpdateStatus(booking.id, "en_route")}>
                                      <Truck className="h-3 w-3 mr-1" />
                                      Start Trip
                                    </Button>
                                  ) : booking.status === "en_route" ? (
                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => handleUpdateStatus(booking.id, "completed")}>
                                      Arrived
                                    </Button>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" onClick={() => handleViewBooking(booking)}>View Details</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="md:hidden space-y-4 px-1">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="border-none rounded-[1.5rem] p-5 space-y-4 bg-card shadow-card ring-1 ring-border/5">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-black text-lg text-foreground leading-tight">Customer {booking.user_id?.slice(-4)}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full uppercase tracking-widest">{booking.car_id?.slice(-6) || "NO CAR"}</span>
                                {getServiceBadge(booking.booking_type)}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(booking.status)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50 border-dashed">
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Verification</p>
                              <div className="flex items-center gap-1.5">
                                {booking.booking_type === 'home_service' ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/20 text-sm shadow-inner">
                                      {booking.verification_code || "----"}
                                    </span>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-primary hover:bg-primary/10 rounded-full"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const link = `${window.location.origin}/track/${booking.id}`;
                                        navigator.clipboard.writeText(link);
                                        toast.success("Tracking link copied!");
                                      }}
                                    >
                                      <Share2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="font-black text-primary text-sm tracking-tight">Q #{booking.queue_number || "---"}</span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Price</p>
                              <p className="font-black text-lg text-foreground">₦{(booking.total_price || 0).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                                <Calendar className="h-3.5 w-3.5 text-primary/60" />
                                <span>{new Date(booking.booking_time).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-black text-primary/80">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{new Date(booking.booking_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>

                          {booking.booking_type === 'home_service' && booking.address_note && (
                            <div className="p-3 bg-primary/5 rounded-[1rem] border border-primary/10 text-foreground text-[11px] leading-relaxed font-medium">
                              <span className="font-black text-[9px] uppercase tracking-widest block mb-1.5 text-primary/70">Address Instructions</span>
                              {booking.address_note}
                            </div>
                          )}

                          <div className="pt-2 flex gap-3">
                            {booking.status === "pending" ? (
                              <>
                                <Button size="sm" variant="outline" className="flex-1 text-green-600 border-green-200 hover:bg-green-50 text-xs h-12 rounded-full font-black shadow-sm" onClick={() => handleAcceptBooking(booking.id)}>ACCEPT</Button>
                                <Button size="sm" variant="outline" className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/5 text-xs h-12 rounded-full font-black shadow-sm" onClick={() => handleRejectBooking(booking.id)}>REJECT</Button>
                              </>
                            ) : (booking.status === "confirmed" && booking.booking_type === "home_service") || booking.status === "en_route" ? (
                              <>
                                <Button size="sm" variant="secondary" className="flex-1 text-xs h-12 rounded-full font-black text-foreground/70" onClick={() => handleViewBooking(booking)}>DETAILS</Button>
                                <Button size="sm" className={cn("flex-[2] text-xs h-12 rounded-full font-black text-white shadow-lg", booking.status === "confirmed" ? "bg-primary shadow-primary/20" : "bg-accent shadow-accent/20")} onClick={() => handleUpdateStatus(booking.id, booking.status === "confirmed" ? "en_route" : "completed")}>
                                  {booking.status === "confirmed" ? "START TRIP" : "ARRIVED"}
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" variant="secondary" className="w-full text-xs h-12 rounded-full font-black text-foreground/70" onClick={() => handleViewBooking(booking)}>VIEW FULL DETAILS</Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {bookings.length === 0 && (
                      <div className="text-center py-8 text-gray-600 text-sm">No recent bookings</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg">Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    {notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-md cursor-pointer ${!notif.is_read ? "bg-blue-50" : ""} hover:bg-gray-100`}
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-sm ${!notif.is_read ? "font-semibold" : ""}`}>{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{new Date(notif.created_at).toLocaleString()}</p>
                        </div>
                        {!notif.is_read && <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />}
                      </div>
                    ))}
                    <Button variant="outline" className="w-full text-xs sm:text-sm" size="sm" onClick={() => navigate("/notifications")}>View All Notifications</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="workers">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Worker Hub</h2>
                  <p className="text-muted-foreground">Manage your staff and their availability</p>
                </div>
                <Button className="gap-2" onClick={() => setIsAddWorkerModalOpen(true)}>
                  <Users className="h-4 w-4" />
                  Add Worker
                </Button>
              </div>

              {workers.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {workers.map((worker: Worker) => (
                    <WorkerCard
                      key={worker.id}
                      worker={worker}
                      onUpdatePhoto={handleUpdateWorkerPhoto}
                      onEdit={handleEditWorker}
                      onStatusChange={async (id, status) => {
                        try {
                          await WorkerService.updateWorkerStatus(id, status);
                          refetchWorkers();
                          toast.success("Status updated");
                        } catch (err) {
                          toast.error("Failed to update status");
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-muted rounded-full">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">No workers yet</h3>
                      <p className="text-muted-foreground">Start adding staff to your carwash to manage bookings effectively.</p>
                    </div>
                    <Button variant="outline" className="mt-2" onClick={() => setIsAddWorkerModalOpen(true)}>Add First Worker</Button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccept={handleAcceptBooking}
        onReject={handleRejectBooking}
        onUpdateStatus={handleUpdateStatus}
        workers={workers}
        onAssignWorker={handleAssignWorker}
      />

      <AddWorkerModal
        isOpen={isAddWorkerModalOpen}
        onClose={() => setIsAddWorkerModalOpen(false)}
        carwashId={user?.carwash_id || ""}
        onSuccess={() => refetchWorkers()}
      />

      <EditWorkerModal
        isOpen={isEditWorkerModalOpen}
        onClose={() => setIsEditWorkerModalOpen(false)}
        worker={selectedWorker}
        onUpdate={handleUpdateWorker}
      />
    </DashboardLayout>
  );
};

export default BusinessDashboard;