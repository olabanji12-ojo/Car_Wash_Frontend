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
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useCarwashBookings, useUpdateBookingStatus } from "@/hooks/useBookings";

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

  const handleCompleteBooking = (id: string) => {
    updateStatusMutation.mutate({ id, status: "completed" });
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
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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