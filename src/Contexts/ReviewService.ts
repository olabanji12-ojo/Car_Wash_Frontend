import axios from 'axios';
import { toast } from 'sonner';
import API_BASE_URL from './baseUrl';

export interface Review {
    id: string;
    user_id: string;
    carwash_id: string;
    order_id?: string;
    rating: number;
    accuracy: number;
    cleanliness: number;
    comment: string;
    photos?: string[];
    response?: string;
    response_date?: string;
    created_at: string;
    customer_name?: string; // Will need to be populated if not returned directly
}

const ReviewService = {
    /**
     * Get reviews for a specific business/carwash
     */
    async getReviewsByBusinessId(carwashId: string): Promise<Review[]> {
        try {
            const token = localStorage.getItem('authToken');
            const config = token ? {
                headers: { 'Authorization': `Bearer ${token}` }
            } : {};

            const response = await axios.get(`${API_BASE_URL}/reviews/business/${carwashId}`, config);
            return response.data.data || response.data;
        } catch (error: any) {
            console.error('Get reviews error:', error);
            throw error;
        }
    },

    /**
     * Reply to a review
     */
    async replyToReview(reviewId: string, responseText: string): Promise<void> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                toast.error("You are not logged in.");
                throw new Error("Authentication token not found.");
            }

            await axios.post(`${API_BASE_URL}/reviews/${reviewId}/reply`,
                { response: responseText },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            toast.success("Response posted successfully!");
        } catch (error: any) {
            console.error('Reply to review error:', error);
            toast.error("Failed to post response");
            throw error;
        }
    },

    /**
     * Get average rating for a carwash
     */
    async getAverageRating(carwashId: string): Promise<{ average: number }> {
        try {
            const response = await axios.get(`${API_BASE_URL}/reviews/carwash/${carwashId}/average`);
            return response.data;
        } catch (error: any) {
            console.error('Get average rating error:', error);
            return { average: 0 };
        }
    },

    /**
     * Create a new review
     */
    async createReview(reviewData: Partial<Review>): Promise<Review> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                toast.error("You are not logged in.");
                throw new Error("Authentication token not found.");
            }

            const response = await axios.post(
                `${API_BASE_URL}/reviews`,
                reviewData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            toast.success("Review submitted successfully!");
            return response.data.data || response.data;
        } catch (error: any) {
            console.error('Create review error:', error);
            const errorMessage = error.response?.data?.error || "Failed to submit review";
            toast.error(errorMessage);
            throw error;
        }
    }
};

export default ReviewService;
