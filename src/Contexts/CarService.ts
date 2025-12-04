import axios from 'axios';
import { toast } from 'sonner';
import API_BASE_URL from './baseUrl';

export interface CarPayload {
    model: string; // Combined "Year Make Model"
    plate: string;
    color?: string;
    is_default?: boolean;
    note?: string;
}

export interface CarResponse {
    id: string;
    owner_id: string;
    model: string;
    plate: string;
    color: string;
    is_default: boolean;
    note: string;
    created_at: string;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error("CRITICAL: No 'authToken' found in localStorage.");
        return { 'Content-Type': 'application/json' };
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const CarService = {
    /**
     * Create a new car profile
     */
    async createCar(carData: CarPayload): Promise<CarResponse> {
        try {
            console.log('🚗 Creating car with data:', carData);
            const response = await axios.post(
                `${API_BASE_URL}/cars/`,
                carData,
                {
                    withCredentials: true,
                    headers: getAuthHeaders()
                }
            );
            console.log('✅ Car created successfully:', response.data);
            // Backend might return { success: true, data: {...} } or just {...}
            return response.data.data || response.data;
        } catch (error: any) {
            console.error('❌ Create car error:', error);
            throw error;
        }
    },

    /**
     * Get all cars for the current user
     */
    async getMyCars(): Promise<CarResponse[]> {
        try {
            console.log('🔍 Fetching my cars...');
            const response = await axios.get(`${API_BASE_URL}/cars/my`, {
                withCredentials: true,
                headers: getAuthHeaders()
            });
            console.log('✅ Fetched cars:', response.data);
            // Backend returns { success: true, data: [...] } or { success: true, data: null }
            // Ensure we always return an array
            const data = response.data.data || response.data;
            return Array.isArray(data) ? data : [];
        } catch (error: any) {
            console.error('❌ Get cars error:', error);
            // Return empty array on error instead of throwing
            return [];
        }
    },

    /**
     * Update a car profile
     */
    async updateCar(id: string, carData: Partial<CarPayload>): Promise<CarResponse> {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/cars/update/${id}`,
                carData,
                {
                    withCredentials: true,
                    headers: getAuthHeaders()
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('Update car error:', error);
            throw error;
        }
    },

    /**
     * Delete a car profile
     */
    async deleteCar(id: string): Promise<void> {
        try {
            await axios.delete(`${API_BASE_URL}/cars/${id}`, {
                withCredentials: true,
                headers: getAuthHeaders()
            });
        } catch (error: any) {
            console.error('Delete car error:', error);
            throw error;
        }
    }
};

export default CarService;
