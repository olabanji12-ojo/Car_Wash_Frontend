import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BookingService, { BookingResponse } from "@/Contexts/BookingService";
import ReviewService, { Review } from "@/Contexts/ReviewService";
import { toast } from "sonner";
import NotificationService, { Notification } from "@/Contexts/NotificationService";
import { useAuth } from "@/Contexts/AuthContext";

/**
 * Hook for Customers to fetch their own bookings
 */
export const useMyBookings = (options?: {
    refetchInterval?: number | false | ((data: BookingResponse[] | undefined) => number | false)
}) => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["my-bookings"],
        queryFn: async () => {
            if (!user) return [];
            console.log("🔄 Polling: Fetching My Bookings...");
            const data = await BookingService.getMyBookings();
            console.log("✅ Polled My Bookings:", data);
            return data;
        },
        enabled: !!user,
        refetchInterval: (query: any) => {
            const interval = options?.refetchInterval;
            if (typeof interval === 'function') {
                return interval(query.state.data as BookingResponse[]);
            }
            return (interval === false || typeof interval === 'number') ? interval : 5000;
        },
        staleTime: 2000,
    });
};

/**
 * Hook for Business Owners to fetch bookings for their carwash
 */
export const useCarwashBookings = (carwashId: string | undefined) => {
    return useQuery({
        queryKey: ["carwash-bookings", carwashId],
        queryFn: async () => {
            if (!carwashId) return [];
            console.log(`[RQ] Polling Carwash Bookings for ${carwashId}...`);
            const data = await BookingService.getBookingsByCarwash(carwashId);
            console.log("[RQ] Received Carwash Bookings:", data);
            return data;
        },
        enabled: !!carwashId,
        refetchInterval: 5000,
        staleTime: 2000,
    });
};

/**
 * Hook to fetch reviews for a business
 */
export const useReviews = (carwashId: string | undefined) => {
    return useQuery({
        queryKey: ["reviews", carwashId],
        queryFn: async () => {
            if (!carwashId) return [];
            console.log(`[RQ] Polling Reviews for ${carwashId}...`);
            const data = await ReviewService.getReviewsByBusinessId(carwashId);
            console.log("[RQ] Received Reviews:", data);
            return data;
        },
        enabled: !!carwashId,
        refetchInterval: 10000, // Reviews don't update as fast as bookings
    });
};

/**
 * Hook to fetch notifications
 */
export const useNotifications = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            if (!user) return [];
            return NotificationService.getMyNotifications();
        },
        enabled: !!user,
        refetchInterval: 5000,
    });
};

/**
 * Hook to handle booking status updates (Accept, Reject, Complete, Cancel)
 */
export const useUpdateBookingStatus = () => {
    const queryClient = useQueryClient();

    return useMutation<BookingResponse | void, Error, { id: string; status: string; code?: string }>({
        mutationFn: async ({ id, status, code }: { id: string; status: string; code?: string }) => {
            if (status === "cancelled_by_user") {
                return await BookingService.cancelBooking(id);
            }
            return await BookingService.updateBookingStatus(id, status, code);
        },
        onSuccess: (_, variables) => {
            console.log("✅ Mutation Success:", variables.status);
            // Invalidate queries to trigger a fresh fetch
            queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
            queryClient.invalidateQueries({ queryKey: ["carwash-bookings"] });

            // Helpful feedback
            const action = variables.status === "cancelled_by_user" ? "cancelled" : variables.status;
            toast.success(`Booking ${action} successfully`);
        },
        onError: (error: any) => {
            console.log("❌ Mutation Error:", error);
            console.error("Mutation error:", error);
            toast.error(error.response?.data?.message || "Failed to update booking");
        }
    });
};
