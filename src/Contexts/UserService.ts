import axios from 'axios';
import { toast } from 'sonner';
import API_BASE_URL from './baseUrl';

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

const getMultipartHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return { 'Content-Type': 'multipart/form-data' };
    }
    return {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
    };
};

export interface UserAddress {
    id?: string;
    type: string; // home, work, other
    address_line: string;
    city: string;
    state: string;
    country: string;
    is_default: boolean;
    label?: string;
    location?: {
        type: "Point";
        coordinates: [number, number];
    };
}

/* TODO: Uncomment when implementing payment integration
export interface PaymentMethod {
    id: string;
    brand: string;
    last4: string;
    expiryMonth: string;
    expiryYear: string;
    isDefault: boolean;
}
*/

export interface NotificationSettings {
    email: boolean;
    sms: boolean;
    push: boolean;
    bookingUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    profile_photo?: string;
    addresses?: UserAddress[];
    // paymentMethods?: PaymentMethod[]; // TODO: Add when payment integration is ready
    notifications?: NotificationSettings;
    accountCreated?: string; // ISO date string
    totalBookings?: number;
    // Add other fields as needed
}

const UserService = {
    /**
     * Get user profile by ID
     */
    async getUserProfile(userId: string): Promise<UserProfile> {
        try {
            const response = await axios.get(`${API_BASE_URL}/user/${userId}`, {
                withCredentials: true,
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            console.error('Get user profile error:', error);
            throw error;
        }
    },

    /**
     * Update user profile
     */
    async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/user/${userId}`,
                data,
                {
                    withCredentials: true,
                    headers: getAuthHeaders()
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('Update user profile error:', error);
            throw error;
        }
    },

    /**
     * Upload profile photo
     */
    async uploadProfilePhoto(userId: string, file: File): Promise<UserProfile> {
        try {
            const formData = new FormData();
            formData.append('profile_photo', file);

            const response = await axios.post(
                `${API_BASE_URL}/user/${userId}/photo`,
                formData,
                {
                    withCredentials: true,
                    headers: getMultipartHeaders()
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('Upload photo error:', error);
            throw error;
        }
    },

    /**
     * Delete profile photo
     */
    async deleteProfilePhoto(userId: string): Promise<UserProfile> {
        try {
            const response = await axios.delete(`${API_BASE_URL}/user/${userId}/photo`, {
                withCredentials: true,
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            console.error('Delete photo error:', error);
            throw error;
        }
    },

    /**
     * Get user addresses
     */
    async getUserAddresses(userId: string): Promise<UserAddress[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/user/${userId}/addresses`, {
                withCredentials: true,
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            console.error('Get addresses error:', error);
            throw error;
        }
    },

    /**
     * Add user address
     */
    async addUserAddress(userId: string, address: UserAddress): Promise<void> {
        try {
            await axios.post(
                `${API_BASE_URL}/user/${userId}/addresses`,
                address,
                {
                    withCredentials: true,
                    headers: getAuthHeaders()
                }
            );
        } catch (error: any) {
            console.error('Add address error:', error);
            throw error;
        }
    },

    /**
     * Delete user address
     */
    async deleteUserAddress(userId: string, addressId: string): Promise<void> {
        try {
            await axios.delete(`${API_BASE_URL}/user/${userId}/addresses/${addressId}`, {
                withCredentials: true,
                headers: getAuthHeaders()
            });
        } catch (error: any) {
            console.error('Delete address error:', error);
            throw error;
        }
    },

    /**
     * Set default address
     */
    async setDefaultAddress(userId: string, addressId: string): Promise<void> {
        try {
            await axios.put(
                `${API_BASE_URL}/user/${userId}/addresses/${addressId}/default`,
                {},
                {
                    withCredentials: true,
                    headers: getAuthHeaders()
                }
            );
        } catch (error: any) {
            console.error('Set default address error:', error);
            throw error;
        }
    }
};

export default UserService;
