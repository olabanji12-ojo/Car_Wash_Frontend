import axios from 'axios';
import { toast } from 'sonner';
import API_BASE_URL from './baseUrl';

// Define the structure of a Booking as expected by the backend
// Based on the Go models, we use snake_case for the API payload
export interface BookingPayload {
    car_id: string;
    carwash_id: string;
    booking_time: string; // ISO 8601 string (e.g., "2023-10-27T10:00:00Z")
    booking_type: 'slot_booking' | 'home_service';
    user_location?: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    address_note?: string;
    notes?: string;
    status?: string; // usually 'pending' by default
}

export interface BookingResponse {
    id: string;
    user_id: string;
    car_id: string;
    carwash_id: string;
    booking_time: string;
    booking_type: 'slot_booking' | 'home_service';
    status: string;
    queue_number: number;
    created_at: string;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
    // Assuming you store the token in localStorage after login
    const token = localStorage.getItem('authToken');

    if (!token) {
        // Handle case where token is not found, maybe redirect to login
        console.error("CRITICAL: No 'authToken' found in localStorage. API request will be unauthenticated.");
        return { 'Content-Type': 'application/json' };
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const BookingService = {
    /**
     * Create a new booking
     * @param bookingData The booking details
     * @returns The created booking object
     */
    async createBooking(bookingData: BookingPayload): Promise<BookingResponse> {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/bookings`,
                bookingData,
                {
                    withCredentials: true,
                    headers: getAuthHeaders()
                }
            );

            if (response.status === 201) {
                return response.data;
            } else {
                throw new Error("Unexpected response status");
            }
        } catch (error: any) {
            console.error('Create booking error:', error);
            throw error;
        }
    },

    /**
     * Get all bookings for the current user
     */
    async getMyBookings(): Promise<BookingResponse[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/bookings/user/me`, {
                withCredentials: true,
                headers: getAuthHeaders()
            });
            // Backend returns {success: true, data: [...]} or {success: true, data: null}
            const data = response.data.data || response.data;
            return Array.isArray(data) ? data : [];
        } catch (error: any) {
            console.error('Get bookings error:', error);
            toast.error('Failed to fetch your bookings');
            return []; // Return empty array instead of throwing
        }
    },

    /**
     * Get a single booking by ID
     */
    /**
     * Get a single booking by ID
     */
    async getBookingById(id: string): Promise<BookingResponse> {
        try {
            const response = await axios.get(`${API_BASE_URL}/bookings/${id}`, {
                withCredentials: true,
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            console.error('Get booking error:', error);
            throw error;
        }
    },

    /**
     * Get bookings for a specific carwash (Business Owner)
     */
    async getBookingsByCarwash(carwashId: string): Promise<BookingResponse[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/bookings/carwash/${carwashId}`, {
                withCredentials: true,
                headers: getAuthHeaders()
            });
            // Backend returns {success: true, data: [...]} or {success: true, data: null}
            const data = response.data.data || response.data;
            return Array.isArray(data) ? data : [];
        } catch (error: any) {
            console.error('Get carwash bookings error:', error);
            toast.error('Failed to fetch carwash bookings');
            return []; // Return empty array instead of throwing
        }
    },

    /**
     * Update booking status (Business Owner)
     */
    async updateBookingStatus(bookingId: string, status: string): Promise<BookingResponse> {
        try {
            const response = await axios.patch(
                `${API_BASE_URL}/bookings/${bookingId}/status`,
                { status },
                {
                    withCredentials: true,
                    headers: getAuthHeaders()
                }
            );
            toast.success(`Booking ${status} successfully`);
            return response.data;
        } catch (error: any) {
            console.error('Update booking status error:', error);
            toast.error('Failed to update booking status');
            throw error;
        }
    },

    /**
     * Cancel a booking (Customer)
     */
    async cancelBooking(bookingId: string): Promise<void> {
        try {
            await axios.delete(`${API_BASE_URL}/bookings/${bookingId}`, {
                withCredentials: true,
                headers: getAuthHeaders()
            });
            toast.success("Booking cancelled successfully");
        } catch (error: any) {
            console.error('Cancel booking error:', error);
            toast.error("Failed to cancel booking");
            throw error;
        }
    },
    /**
     * Get available slots for a specific carwash and date
     */
    async getAvailableSlots(carwashId: string, date: string): Promise<any[]> {
        try {
            // Correct endpoint: /api/bookings/carwash/{carwash_id}/slots
            const response = await axios.get(`${API_BASE_URL}/bookings/carwash/${carwashId}/slots?date=${date}`, {
                withCredentials: true,
                headers: getAuthHeaders()
            });
            // Backend returns {success: true, data: [...]}
            return response.data.data || response.data || [];
        } catch (error: any) {
            console.error('Get available slots error:', error);
            // Return empty array instead of throwing to avoid breaking the UI completely
            return [];
        }
    },
};

export default BookingService;
