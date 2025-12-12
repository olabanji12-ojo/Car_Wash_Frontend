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
  User,
  Car,
  CheckCircle,
  XCircle,
  MessageSquare,
  Filter,
} from "lucide-react";

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

const mockBookings: Booking[] = [
  {
    id: "1",
    customerName: "John Doe",
    serviceType: "slot",
    date: "2025-10-25",
    time: "10:00",
    status: "pending",
    serviceName: "Full Wash",
    addOns: ["Wax", "Interior Cleaning"],
    paymentStatus: "pending",
    totalAmount: 5000,
  },
  {
    id: "2",
    customerName: "Jane Smith",
    serviceType: "home",
    date: "2025-10-26",
    time: "14:00",
    status: "confirmed",
    serviceName: "Premium Wash",
    addOns: ["Tire Shine"],
    paymentStatus: "paid",
    totalAmount: 8000,
    address: "456 Park Avenue, Lagos",
  },
];

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // ✅ PROCESS 1.1: Fetch real bookings from backend
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);

        // Get carwash_id from localStorage
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          toast.error("Please log in to view bookings");
          navigate('/login');
          return;
        }

        const user = JSON.parse(storedUser);
        if (!user.carwash_id) {
          toast.error("No carwash found for this account");
          setIsLoading(false);
          return;
        }

        console.log('📋 Fetching bookings for carwash:', user.carwash_id);

        // Import BookingService dynamically to avoid circular dependencies
        const { default: BookingService } = await import('@/Contexts/BookingService');
        const fetchedBookings = await BookingService.getBookingsByCarwash(user.carwash_id);

        console.log('✅ Bookings fetched:', fetchedBookings);

        // Transform backend data to match our Booking interface
        const transformedBookings: Booking[] = (Array.isArray(fetchedBookings) ? fetchedBookings : []).map((b: any) => ({
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

        setBookings(transformedBookings);
        console.log('✅ Transformed bookings:', transformedBookings.length);
      } catch (error) {
        console.error('❌ Failed to fetch bookings:', error);
        toast.error("Failed to load bookings");
        setBookings([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [navigate]);

  useEffect(() => {
    let filtered = bookings;
    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }
    if (dateFilter) {
      filtered = filtered.filter((booking) => booking.date.includes(dateFilter));
    }
    setFilteredBookings(filtered);
  }, [statusFilter, dateFilter, bookings]);

  // ✅ PROCESS 1.2: Wire Accept button to backend API
  const handleAcceptBooking = async (id: string) => {
    try {
      console.log('✅ Accepting booking:', id);
      const { default: BookingService } = await import('@/Contexts/BookingService');
      await BookingService.updateBookingStatus(id, "confirmed");

      // Update local state
      setBookings(
        bookings.map((booking) =>
          booking.id === id ? { ...booking, status: "confirmed" } : booking
        )
      );
      toast.success("Booking confirmed", { style: { color: "#10B981" } });
    } catch (error) {
      console.error('❌ Failed to accept booking:', error);
      toast.error("Failed to confirm booking");
    }
  };

  // ✅ PROCESS 1.2: Wire Reject button to backend API
  const handleRejectBooking = async (id: string) => {
    try {
      console.log('❌ Rejecting booking:', id);
      const { default: BookingService } = await import('@/Contexts/BookingService');
      await BookingService.updateBookingStatus(id, "cancelled");

      // Update local state
      setBookings(
        bookings.map((booking) =>
          booking.id === id ? { ...booking, status: "cancelled" } : booking
        )
      );
      toast.success("Booking rejected", { style: { color: "#10B981" } });
    } catch (error) {
      console.error('❌ Failed to reject booking:', error);
      toast.error("Failed to reject booking");
    }
  };

  // ✅ PROCESS 1.3: Wire Complete button to backend API
  const handleCompleteBooking = async (id: string) => {
    try {
      console.log('✅ Completing booking:', id);
      const { default: BookingService } = await import('@/Contexts/BookingService');
      await BookingService.updateBookingStatus(id, "completed");

      // Update local state
      setBookings(
        bookings.map((booking) =>
          booking.id === id ? { ...booking, status: "completed" } : booking
        )
      );
      toast.success("Booking marked as completed", { style: { color: "#10B981" } }); // Green success
    } catch (error) {
      console.error('❌ Failed to complete booking:', error);
      toast.error("Failed to update status");
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
    toast.success("Message sent", { style: { color: "#10B981" } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="sticky top-0 z-50 bg-[#F9FAFB]/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Bookings Management</h1>
          <Button variant="ghost" size="icon">
            <Calendar className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Manage Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="status-filter">Filter by Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="date-filter">Filter by Date</Label>
                <Input
                  id="date-filter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
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
                      <td className="py-2 px-4">
                        {booking.date} {booking.time}
                      </td>
                      <td className="py-2 px-4">
                        <span
                          className={
                            booking.status === "pending"
                              ? "text-yellow-600"
                              : booking.status === "confirmed"
                                ? "text-green-600"
                                : booking.status === "cancelled"
                                  ? "text-red-600"
                                  : "text-blue-600"
                          }
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-2 px-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBookingDetails(booking)}
                        >
                          View
                        </Button>
                        {booking.status === "pending" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcceptBooking(booking.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRejectBooking(booking.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <Button
                            variant="default" // Use primary color to indicate completion is the next positive step
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleCompleteBooking(booking.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Completed
                          </Button>
                        )}
                        {booking.serviceType === "home" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openBookingDetails(booking)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Customer</Label>
                  <p>{selectedBooking.customerName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Service</Label>
                  <p>{selectedBooking.serviceName} ({selectedBooking.serviceType === "slot" ? "Slot" : "Home Service"})</p>
                </div>
                <div>
                  <Label className="font-semibold">Date/Time</Label>
                  <p>{selectedBooking.date} at {selectedBooking.time}</p>
                </div>
                {selectedBooking.serviceType === "home" && (
                  <div>
                    <Label className="font-semibold">Address</Label>
                    <p>{selectedBooking.address}</p>
                  </div>
                )}
                <div>
                  <Label className="font-semibold">Add-Ons</Label>
                  <p>{selectedBooking.addOns.join(", ") || "None"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Payment Status</Label>
                  <p>{selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}</p>
                </div>
                <div>
                  <Label className="font-semibold">Total Amount</Label>
                  <p>₦{selectedBooking.totalAmount.toLocaleString()}</p>
                </div>
                {selectedBooking.serviceType === "home" && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Messages</Label>
                    <div className="max-h-48 overflow-y-auto border p-2 rounded-md">
                      {messages.length === 0 ? (
                        <p className="text-[#6B7280]">No messages yet</p>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`mb-2 p-2 rounded-md ${msg.sender === "owner" ? "bg-[#2563EB] text-white ml-auto" : "bg-[#E5E7EB] text-black"
                              }`}
                          >
                            <p>{msg.content}</p>
                            <p className="text-xs opacity-70">
                              {new Date(msg.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={3}
                    />
                    <Button onClick={handleSendMessage}>Send Message</Button>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BookingsManagement;