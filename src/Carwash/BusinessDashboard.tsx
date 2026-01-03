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

  const handleUpdateStatus = (id: string, status: string) => {
    const booking = bookings.find((b: any) => b.id === id);
    if (status === "completed" && booking?.booking_type === "home_service") {
      const code = window.prompt("Please enter the customer's 4-digit verification code to complete this home service:");
      if (!code) {
        toast.error("Verification code is required to complete home service.");
        return;
      }
      updateStatusMutation.mutate({ id, status, code });
      return;
    }
    updateStatusMutation.mutate({ id, status });
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
        return <Badge variant="outline" className="text-orange-500 border-orange-500 text-xs">Pending</Badge>;
      case "confirmed":
        return <Badge className="bg-green-500 text-xs">Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-blue-600 text-xs">Completed</Badge>;
      case "en_route":
        return <Badge className="bg-blue-400 text-white border-blue-400 text-[10px] animate-pulse">🚚 En Route</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="text-xs">Cancelled</Badge>;
      default:
        return <Badge className="text-xs">{status}</Badge>;
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
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] sm:text-sm text-gray-600">Total Bookings</p>
                          <p className="text-base sm:text-2xl font-bold">{metrics.totalBookings}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] sm:text-sm text-gray-600">Revenue</p>
                          <p className="text-base sm:text-2xl font-bold">₦{metrics.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="hidden lg:block"><Separator /></div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                          <Star className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] sm:text-sm text-gray-600">Avg Rating</p>
                          <p className="text-base sm:text-2xl font-bold">{metrics.averageRating}/5</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-50">
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] sm:text-sm text-gray-600">Pending</p>
                          <p className="text-base sm:text-2xl font-bold">{metrics.pendingBookings}</p>
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

                    <div className="md:hidden space-y-3">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="border rounded-xl p-4 space-y-3 bg-card shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-sm">Customer {booking.user_id?.slice(-4)}</p>
                              <p className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">{booking.car_id?.slice(-6)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              {getStatusBadge(booking.status)}
                              {getServiceBadge(booking.booking_type)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 py-2 border-y border-dashed">
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase font-bold text-muted-foreground">Verification</p>
                              <div className="flex items-center gap-1.5">
                                {booking.booking_type === 'home_service' ? (
                                  <span className="font-mono font-black text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 text-xs">
                                    {booking.verification_code || "----"}
                                  </span>
                                ) : (
                                  <span className="font-bold text-primary text-xs">Q #{booking.queue_number || "---"}</span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="text-[9px] uppercase font-bold text-muted-foreground">Price</p>
                              <p className="font-bold text-sm text-foreground">₦{(booking.total_price || 0).toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(booking.booking_time).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-semibold text-blue-600">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(booking.booking_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          {booking.booking_type === 'home_service' && booking.address_note && (
                            <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100/50 text-blue-900 italic text-[10px] leading-relaxed">
                              <span className="font-black text-[8px] uppercase not-italic block mb-1 text-blue-600">Address Details</span>
                              {booking.address_note}
                            </div>
                          )}

                          <div className="pt-1">
                            {booking.status === "pending" ? (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1 text-green-600 border-green-600 text-xs h-9" onClick={() => handleAcceptBooking(booking.id)}>Accept</Button>
                                <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-600 text-xs h-9" onClick={() => handleRejectBooking(booking.id)}>Reject</Button>
                              </div>
                            ) : (booking.status === "confirmed" && booking.booking_type === "home_service") || booking.status === "en_route" ? (
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="flex-1 text-xs h-9" onClick={() => handleViewBooking(booking)}>Details</Button>
                                <Button size="sm" className={cn("flex-1 text-xs h-9", booking.status === "confirmed" ? "bg-blue-600" : "bg-purple-600")} onClick={() => handleUpdateStatus(booking.id, booking.status === "confirmed" ? "en_route" : "completed")}>
                                  {booking.status === "confirmed" ? "Start Trip" : "Arrived"}
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" className="w-full text-xs h-9" onClick={() => handleViewBooking(booking)}>View Full Details</Button>
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
                    <Button variant="outline" className="w-full text-xs sm:text-sm" size="sm">View All Notifications</Button>
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