import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  MapPin,
  Search,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useCarwashBookings, useUpdateBookingStatus } from "@/hooks/useBookings";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Booking {
  id: string;
  customerName: string;
  serviceType: "slot" | "home";
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  serviceName: string;
  addOns: string[];
  paymentStatus: "pending" | "paid";
  totalAmount: number;
  address?: string;
}

interface Message {
  id: string;
  sender: "owner" | "customer";
  content: string;
  timestamp: string;
}

const mockMessages: Message[] = [
  {
    id: "1",
    sender: "customer",
    content: "Can you confirm the time for the home service?",
    timestamp: "2025-10-25T09:00:00Z",
  },
  {
    id: "2",
    sender: "owner",
    content: "Yes, we'll arrive at 14:00. Please ensure access to water.",
    timestamp: "2025-10-25T09:15:00Z",
  },
];

const BookingsManagement = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const { data: rawBookings = [], isLoading } = useCarwashBookings(user?.carwash_id);
  const updateStatusMutation = useUpdateBookingStatus();

  // Transform raw bookings to the local Booking interface
  const bookings: Booking[] = (Array.isArray(rawBookings) ? rawBookings : []).map((b: any) => ({
    id: b.id || b._id,
    customerName: b.customer_name || 'Unknown Customer',
    serviceType: b.booking_type === 'home_service' ? 'home' : 'slot',
    date: b.booking_time ? new Date(b.booking_time).toISOString().split('T')[0] : '',
    time: b.booking_time ? new Date(b.booking_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
    status: b.status || 'pending',
    serviceName: b.service_name || 'Car Wash',
    addOns: b.add_ons || [],
    paymentStatus: b.payment_status || 'pending',
    totalAmount: b.total_price || 0,
    address: b.address_note || b.user_location?.address || '',
  }));

  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesDate = !dateFilter || booking.date.includes(dateFilter);
    return matchesStatus && matchesDate;
  });

  const handleAcceptBooking = (id: string) => {
    updateStatusMutation.mutate({ id, status: "confirmed" });
  };

  const handleRejectBooking = (id: string) => {
    updateStatusMutation.mutate({ id, status: "cancelled" });
  };

  const handleCompleteBooking = (id: string, code?: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (booking?.serviceType === "home" && !code) {
      const promptCode = window.prompt("Enter customer's 4-digit verification code:");
      if (promptCode) {
        updateStatusMutation.mutate({ id, status: "completed", code: promptCode });
      } else {
        toast.error("Verification code required for home service");
      }
    } else {
      updateStatusMutation.mutate({ id, status: "completed", code });
    }
  };

  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setMessages(booking.serviceType === "home" ? mockMessages : []);
    setIsDialogOpen(true);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    const message: Message = {
      id: `${messages.length + 1}`,
      sender: "owner",
      content: newMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages([...messages, message]);
    setNewMessage("");
    toast.success("Message sent");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-10 w-48 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-muted/30 p-4 rounded-2xl border border-primary/5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-4 p-4 border rounded-2xl bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Manage Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-muted/30 p-4 rounded-2xl border border-primary/5">
              <div className="space-y-2">
                <Label htmlFor="status-filter" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Current Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="h-12 rounded-xl border-2 bg-white shadow-sm focus:ring-blue-600 transition-all font-bold">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    <SelectItem value="all" className="font-bold">All Appointments</SelectItem>
                    <SelectItem value="pending" className="text-orange-600 font-bold">Pending</SelectItem>
                    <SelectItem value="confirmed" className="text-green-600 font-bold">Confirmed</SelectItem>
                    <SelectItem value="cancelled" className="text-red-600 font-bold">Cancelled</SelectItem>
                    <SelectItem value="completed" className="text-blue-600 font-bold">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-filter" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Filter by Date</Label>
                <div className="relative">
                  <Input
                    id="date-filter"
                    type="date"
                    className="h-12 rounded-xl border-2 bg-white shadow-sm focus:ring-blue-600 transition-all font-bold pr-10"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              {filteredBookings.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-4">Customer</th>
                      <th className="py-2 px-4">Service Type</th>
                      <th className="py-2 px-4">Date/Time</th>
                      <th className="py-2 px-4">Status</th>
                      <th className="py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="border-b">
                        <td className="py-2 px-4">{booking.customerName}</td>
                        <td className="py-2 px-4">
                          {booking.serviceType === "slot" ? "Slot" : "Home Service"}
                        </td>
                        <td className="py-2 px-4 whitespace-nowrap">
                          {booking.date} {booking.time}
                        </td>
                        <td className="py-2 px-4">
                          <span className={
                            booking.status === "pending" ? "text-yellow-600" :
                              booking.status === "confirmed" ? "text-green-600" :
                                booking.status === "cancelled" ? "text-red-600" : "text-blue-600"
                          }>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-2 px-4 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openBookingDetails(booking)}>View</Button>
                          {booking.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => handleAcceptBooking(booking.id)}><CheckCircle className="h-4 w-4 mr-1" />Accept</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleRejectBooking(booking.id)}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                            </>
                          )}
                          {booking.status === "confirmed" && (
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => handleCompleteBooking(booking.id)}><CheckCircle className="h-4 w-4 mr-1" />Mark Completed</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-xl space-y-4">
                  <div className="flex justify-center"><div className="bg-muted/30 p-4 rounded-full"><Search size={40} className="text-muted-foreground" /></div></div>
                  <div>
                    <h3 className="text-lg font-bold">No Bookings Found</h3>
                    <p className="text-muted-foreground">There are no bookings matching your current filter.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <Card key={booking.id} className="overflow-hidden border-none rounded-[1.5rem] shadow-card ring-1 ring-border/5 bg-white">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-black text-lg text-foreground leading-tight">{booking.customerName}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">#{booking.id.slice(-6).toUpperCase()}</span>
                            <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50 text-[10px] h-5 uppercase px-2 font-black">
                              {booking.serviceType === "slot" ? "On-site" : "Home"}
                            </Badge>
                          </div>
                        </div>
                        <Badge className={cn(
                          "font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-wider shadow-sm",
                          booking.status === "pending" ? "bg-orange-50 text-orange-600 border border-orange-200" :
                            booking.status === "confirmed" ? "bg-primary text-white shadow-primary/20" :
                              booking.status === "completed" ? "bg-green-600 text-white shadow-green-200" : "bg-destructive text-white"
                        )}>
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50 border-dashed">
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Schedule</p>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground">{booking.date}</span>
                            <span className="text-xs font-black text-primary">{booking.time}</span>
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Amount</p>
                          <p className="font-black text-lg text-foreground">₦{booking.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-muted/20 rounded-[1rem] border border-border/50">
                          <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-1">Service Details</p>
                          <p className="text-sm font-bold text-foreground">{booking.serviceName}</p>
                          {booking.addOns.length > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-1 italic">
                              + {booking.addOns.join(", ")}
                            </p>
                          )}
                        </div>

                        {booking.serviceType === "home" && booking.address && (
                          <div className="p-3 bg-blue-50/50 rounded-[1rem] border border-blue-100/50">
                            <p className="text-[9px] uppercase font-black text-blue-600 tracking-widest mb-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Address
                            </p>
                            <p className="text-[11px] font-medium leading-relaxed text-blue-900/80">{booking.address}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Button
                          variant="secondary"
                          className="flex-1 h-12 rounded-full font-black text-xs shadow-sm"
                          onClick={() => openBookingDetails(booking)}
                        >
                          VIEW DETAILS
                        </Button>
                        {booking.status === "pending" && (
                          <div className="flex gap-2 w-full">
                            <Button
                              className="flex-[2] bg-green-600 hover:bg-green-700 h-12 rounded-full font-black text-xs shadow-lg shadow-green-200 text-white"
                              onClick={() => handleAcceptBooking(booking.id)}
                            >
                              ACCEPT
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1 h-12 rounded-full font-black text-xs shadow-lg shadow-red-200"
                              onClick={() => handleRejectBooking(booking.id)}
                            >
                              REJECT
                            </Button>
                          </div>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-full font-black text-xs shadow-lg shadow-purple-200 text-white"
                            onClick={() => handleCompleteBooking(booking.id)}
                          >
                            MARK AS COMPLETED
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-[2rem] space-y-4">
                  <div className="flex justify-center"><div className="bg-muted/30 p-4 rounded-full"><Search size={40} className="text-muted-foreground" /></div></div>
                  <div>
                    <h3 className="text-lg font-bold">No Bookings Found</h3>
                    <p className="text-muted-foreground">There are no bookings matching your current filter.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            {/* ... content remains same in spirit ... */}
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div><Label className="font-semibold">Customer</Label><p>{selectedBooking.customerName}</p></div>
                <div><Label className="font-semibold">Service</Label><p>{selectedBooking.serviceName} ({selectedBooking.serviceType === "slot" ? "Slot" : "Home Service"})</p></div>
                <div><Label className="font-semibold">Date/Time</Label><p>{selectedBooking.date} at {selectedBooking.time}</p></div>
                {selectedBooking.serviceType === "home" && <div><Label className="font-semibold">Address</Label><p>{selectedBooking.address}</p></div>}
                <div><Label className="font-semibold">Add-Ons</Label><p>{selectedBooking.addOns.join(", ") || "None"}</p></div>
                <div><Label className="font-semibold">Payment Status</Label><p>{selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}</p></div>
                <div><Label className="font-semibold">Total Amount</Label><p>₦{selectedBooking.totalAmount.toLocaleString()}</p></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default BookingsManagement;