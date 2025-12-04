import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Search,
  MessageSquare
} from "lucide-react";
import BookingService, { BookingResponse } from "@/Contexts/BookingService";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ReviewModal } from "@/components/ReviewModal";

// ... existing imports

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

const statusConfig: Record<string, any> = {
  pending: {
    icon: <Clock className="h-4 w-4" />,
    textColor: "text-orange-500",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-500",
    badgeText: "⏳ PENDING",
  },
  confirmed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    textColor: "text-blue-500",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-500",
    badgeText: "✓ CONFIRMED",
  },
  completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    textColor: "text-gray-500",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-500",
    badgeText: "✓ COMPLETED",
  },
  cancelled: {
    icon: <XCircle className="h-4 w-4" />,
    textColor: "text-red-500",
    bgColor: "bg-red-100",
    borderColor: "border-red-500",
    badgeText: "✗ DECLINED",
  },
};

const BookingCard = ({
  booking,
  onCancel,
  onReview
}: {
  booking: BookingResponse;
  onCancel: (id: string) => void;
  onReview: (booking: BookingResponse) => void;
}) => {
  const config = statusConfig[booking.status] || statusConfig.pending;
  const date = new Date(booking.booking_time);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300 rounded-xl">
      <CardContent className="p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
          {/* Content Section */}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">Booking #{booking.queue_number}</h3>
                <p className="text-sm text-muted-foreground">ID: {booking.id.slice(-6)}</p>
              </div>
              <Badge className={cn("text-xs font-bold", config.bgColor, config.textColor)}>
                {config.badgeText}
              </Badge>
            </div>

            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-3">
              <p><span className="font-semibold">Date/Time:</span> {format(date, "PPP p")}</p>
              <p><span className="font-semibold">Car ID:</span> {booking.car_id}</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end mt-4 pt-4 border-t gap-2">
              {booking.status === 'pending' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onCancel(booking.id)}
                >
                  Cancel Booking
                </Button>
              )}
              {booking.status === 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReview(booking)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Leave Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState = ({ status }: { status: string }) => {
  const navigate = useNavigate();
  return (
    <div className="text-center py-12 sm:py-16 px-4 sm:px-6 border-2 border-dashed rounded-xl">
      <div className="flex justify-center mb-4"><Search size={60} className="text-gray-400" /></div>
      <h2 className="text-lg sm:text-xl font-semibold mb-2">No {status} bookings</h2>
      <p className="text-sm sm:text-base text-muted-foreground mb-6">You have no {status} bookings at the moment.</p>
      <Button onClick={() => navigate("/dashboard")}>
        <Search className="mr-2 h-4 w-4" /> Find a Carwash
      </Button>
    </div>
  );
};

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("pending");

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = () => {
    setLoading(true);
    BookingService.getMyBookings()
      .then((data) => {
        const bookingsArray = Array.isArray(data) ? data : [];
        setBookings(bookingsArray);
      })
      .catch(err => {
        console.error("Failed to fetch bookings", err);
        toast.error("Failed to load bookings");
        setBookings([]);
      })
      .finally(() => setLoading(false));
  };

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await BookingService.cancelBooking(id);
      setBookings(bookings.filter(b => b.id !== id));
      toast.success("Booking cancelled successfully");
    } catch (error: any) {
      console.error("Failed to cancel booking", error);
      const errorMessage = error.response?.data?.message || "Failed to cancel booking";
      toast.error(errorMessage);
    }
  };

  const handleReviewClick = (booking: BookingResponse) => {
    setSelectedBooking(booking);
    setIsReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    toast.success("Thank you for your feedback!");
    // Optionally refresh bookings or mark as reviewed if backend supports it
  };

  const tabs = ["pending", "confirmed", "completed", "cancelled"];

  const filteredBookings = bookings.filter(b => b.status === activeTab);
  const bookingCounts = tabs.reduce((acc, tab) => {
    acc[tab] = bookings.filter(b => b.status === tab).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <div className="p-8 text-center">Loading bookings...</div>;

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">My Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Note: Cancellations are only allowed up to 24 hours before your appointment.
          </p>
        </div>

        <div className="border-b mb-4 sm:mb-6 -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-2 border-b-2 font-semibold flex items-center gap-2 whitespace-nowrap flex-shrink-0 text-sm sm:text-base capitalize",
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                )}
              >
                {tab}
                <Badge className={cn(
                  "text-xs",
                  activeTab === tab ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
                )}>
                  {bookingCounts[tab]}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancelBooking}
                onReview={handleReviewClick}
              />
            ))
          ) : (
            <EmptyState status={activeTab} />
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedBooking && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          carwashId={selectedBooking.carwash_id}
          orderId={selectedBooking.id} // Assuming order_id maps to booking id
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
};

export default MyBookingsPage;