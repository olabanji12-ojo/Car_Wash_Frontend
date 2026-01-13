import { useState } from "react";
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
  MessageSquare,
  Car,
  Truck,
  Star,
  User,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookingResponse } from "@/Contexts/BookingService";
import { ReviewModal } from "@/components/ReviewModal";
import { useMyBookings, useUpdateBookingStatus } from "@/hooks/useBookings";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LiveTrackingMap } from "@/components/dashboard/LiveTrackingMap";
import { useAuth } from "@/Contexts/AuthContext";

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
  en_route: {
    icon: <Truck className="h-4 w-4" />,
    textColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-600",
    badgeText: "🚚 EN ROUTE",
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
                <h3 className="font-bold text-lg">
                  {booking.booking_type === 'home_service'
                    ? `Home Appointment`
                    : `Slot Booking #${booking.queue_number} `}
                </h3>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4">
                    {booking.booking_type === 'home_service' ? 'Home' : 'On-site'}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground">ID: {booking.id.slice(-6)}</p>
                </div>
              </div>
              <Badge className={cn("text-xs font-bold", config.bgColor, config.textColor)}>
                {config.badgeText}
              </Badge>
            </div>

            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm mb-3">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-2xl border border-primary/5">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date & Time
                  </p>
                  <p className="font-outfit font-bold text-sm">{format(date, "MMM dd, yyyy")}</p>
                  <p className="font-outfit text-primary font-semibold">{format(date, "p")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    {booking.booking_type === 'home_service' ? (
                      <><Clock className="h-3 w-3" /> Verification</>
                    ) : (
                      <><Search className="h-3 w-3" /> Queue Number</>
                    )}
                  </p>
                  <p className="font-mono font-black text-xl text-primary tracking-widest bg-primary/5 px-2 py-0.5 rounded-lg inline-block border border-primary/10 shadow-sm">
                    {booking.booking_type === 'home_service'
                      ? (booking.verification_code || "----")
                      : (booking.queue_number || "---")
                    }
                  </p>
                  <p className="text-[10px] text-muted-foreground italic">
                    {booking.booking_type === 'home_service' ? "Handshake Code" : "Show at Entrance"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 px-1">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold text-xs uppercase tracking-tight">Car: {booking.car_id.slice(-6).toUpperCase()}</span>
                </div>
                {booking.queue_number && (
                  <Badge variant="outline" className="text-[10px] font-bold border-primary/20 bg-primary/5">
                    QUEUE #{booking.queue_number}
                  </Badge>
                )}
              </div>

              {booking.booking_type === 'home_service' && booking.address_note && (
                <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-100/50 text-blue-900/80 italic text-xs leading-relaxed">
                  <p className="font-black text-[9px] uppercase not-italic mb-1 text-blue-600 flex items-center gap-1">
                    <Truck className="h-3 w-3" /> Location Instructions
                  </p>
                  {booking.address_note}
                </div>
              )}

              {booking.worker_id && (
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border border-primary/10 mt-4 animate-in fade-in zoom-in-95 duration-500">
                  <div className="h-10 w-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border border-primary/20">
                    {booking.worker_photo ? (
                      <img src={booking.worker_photo} alt="Worker" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Assigned Professional</p>
                    <p className="text-sm font-bold">{booking.worker_name || "Assigned Worker"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {booking.status === "en_route" && booking.user_location && (
              <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Live Trip Tracking</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-200 uppercase">En Route</Badge>
                </div>
                <LiveTrackingMap
                  workerLocation={booking.worker_location?.coordinates as [number, number]}
                  customerLocation={booking.user_location.coordinates as [number, number]}
                />
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">Worker is on their way!</p>
                    <p className="text-[10px] text-blue-600/70 italic">Please stay available at the provided address.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4 pt-4 border-t gap-2">
              {booking.status === "completed" && (
                <Button
                  variant="default"
                  className="w-full bg-green-600 hover:bg-green-700 mt-2"
                  onClick={() => onReview(booking)}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Confirm & Rate Experience
                </Button>
              )}

              {booking.status === "pending" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onCancel(booking.id)}
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 💡 New Empty State Component
const EmptyState = ({ status }: { status: string }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed border-muted rounded-[2rem] bg-muted/5 space-y-4">
      <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mb-2">
        {status === "pending" && <Clock className="h-10 w-10 text-orange-400" />}
        {status === "confirmed" && <CheckCircle2 className="h-10 w-10 text-blue-500" />}
        {status === "completed" && <Star className="h-10 w-10 text-green-500" />}
        {status === "cancelled" && <XCircle className="h-10 w-10 text-red-400" />}
        {!["pending", "confirmed", "completed", "cancelled"].includes(status) && <Search className="h-10 w-10 text-muted-foreground" />}
      </div>

      <div className="space-y-1 max-w-xs">
        <h2 className="text-xl font-bold tracking-tight text-foreground">No {status} bookings</h2>
        <p className="text-sm text-muted-foreground">
          {status === 'pending' && "You don't have any upcoming appointments pending approval."}
          {status === 'confirmed' && "No confirmed bookings yet. Hang tight!"}
          {status === 'completed' && "You haven't completed any services yet."}
          {status === 'cancelled' && "No cancelled bookings to show."}
        </p>
      </div>

      <Button onClick={() => navigate("/dashboard")} className="rounded-full font-bold px-8 shadow-lg shadow-primary/20">
        <Search className="mr-2 h-4 w-4" /> Book a Service
      </Button>
    </div>
  );
};

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tabs = ["pending", "confirmed", "completed", "cancelled"];
  const [activeTab, setActiveTab] = useState<string>("pending");
  const { data: bookings = [], isLoading, refetch } = useMyBookings({
    refetchInterval: (data) => data?.some((b: any) => b.status === "en_route") ? 3000 : 5000
  });
  const [reviewBooking, setReviewBooking] = useState<BookingResponse | null>(null);
  const updateStatusMutation = useUpdateBookingStatus();

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    updateStatusMutation.mutate({ id, status: "cancelled_by_user" });
  };

  if (!user && !isLoading) {
    return (
      <div className="bg-gray-50/50 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 bg-white rounded-2xl shadow-sm border">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">View Your Bookings</h1>
            <p className="text-muted-foreground">
              Sign in to track your appointments, manage vehicles, and see your booking history.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/login")} className="w-full bg-blue-600 hover:bg-blue-700">
              Sign In
            </Button>
            <Button onClick={() => navigate("/signup")} variant="outline" className="w-full">
              Create Account
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-4">
            New here? <span className="text-blue-600 font-semibold cursor-pointer" onClick={() => navigate("/dashboard")}>Browse carwashes</span> first.
          </p>
        </div>
      </div>
    );
  }

  const filteredBookings = bookings.filter(b => {
    if (activeTab === "confirmed") {
      return b.status === "confirmed" || b.status === "en_route";
    }
    return b.status === activeTab;
  });

  const bookingCounts = tabs.reduce((acc, tab) => {
    if (tab === "confirmed") {
      acc[tab] = bookings.filter(b => b.status === "confirmed" || b.status === "en_route").length;
    } else {
      acc[tab] = bookings.filter(b => b.status === tab).length;
    }
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="bg-gray-50/50 min-h-screen">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="mb-8 space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-xl overflow-hidden border-none shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-40 rounded-md" />
                          <Skeleton className="h-4 w-24 rounded-md" />
                        </div>
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-20 w-full rounded-2xl" />
                        <Skeleton className="h-20 w-full rounded-2xl" />
                      </div>
                      <Skeleton className="h-4 w-1/3 rounded-md" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
          {/* Mobile Select - Only visible on small screens */}
          <div className="block sm:hidden pb-4">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full h-12 rounded-xl border-2 font-bold focus:ring-blue-600 bg-white shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
                {tabs.map((tab) => (
                  <SelectItem key={tab} value={tab} className="capitalize font-bold py-3 focus:bg-blue-50 focus:text-blue-600">
                    <div className="flex items-center justify-between w-full min-w-[200px]">
                      <span>{tab} Bookings</span>
                      <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-600 border-none px-2 rounded-full">
                        {bookingCounts[tab]}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Tabs - Hidden on small screens */}
          <div className="hidden sm:flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-2 border-b-2 font-semibold flex items-center gap-2 whitespace-nowrap flex-shrink-0 text-sm sm:text-base capitalize transition-all duration-200",
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                )}
              >
                {tab}
                <Badge className={cn(
                  "text-[10px] px-2 py-0 h-4 rounded-full border-none",
                  activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
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
                onReview={(b) => setReviewBooking(b)}
              />
            ))
          ) : (
            <EmptyState status={activeTab} />
          )}
        </div>

        {reviewBooking && (
          <ReviewModal
            isOpen={!!reviewBooking}
            onClose={() => setReviewBooking(null)}
            carwashId={reviewBooking.carwash_id}
            orderId={reviewBooking.id}
            onSuccess={() => {
              toast.success("Thank you for your review!");
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;