import axios from 'axios';
import API_BASE_URL from './baseUrl';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return { 'Content-Type': 'application/json' };
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const PaymentService = {
    /**
     * Get earnings summary for a carwash
     * @param carwashId The ID of the carwash
     */
    async getEarningsSummary(carwashId: string): Promise<any> {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/payment/summary/${carwashId}`,
                {
                    withCredentials: true,
                    headers: getAuthHeaders()
                }
            );

            return response.data.data || response.data;
        } catch (error: any) {
            console.error('Get earnings summary error:', error);
            // Return default empty structure to prevent crashes
            // Use snake_case to match dashboard expectations
            return {
                total_revenue: 0,
                total_bookings: 0,
                pending_bookings: 0,
                daily: 0,
                weekly: 0,
                monthly: 0,
                balance: 0
            };
        }
    }
};

export default PaymentService;
