import axios from 'axios';
import { toast } from 'sonner';
import API_BASE_URL from './baseUrl';

export interface Carwash {
    id: string;
    name: string;
    description: string;
    address: string;
    location: {
        type: string;
        coordinates: [number, number]; // [lng, lat]
    };
    photo_gallery?: string[];
    photos?: string[]; // Alternative field name
    services: any[];
    is_active: boolean;
    is_open?: boolean;
    rating: number;
    average_rating?: number;
    review_count?: number; // Number of reviews
    phone?: string;
    about?: string;
    features?: string[];
    addons?: any[];
    operating_hours?: any[];
    // Add other fields as needed
}

const CarwashService = {
    /**
     * Get all active car washes
     */
    async getAllCarwashes(): Promise<Carwash[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/carwashes`);
            // Log the response to see its structure
            console.log('Response from getAllCarwashes:', response.data);
            return response.data.data; // Return the nested data array
        } catch (error: any) {
            console.error('Get all carwashes error:', error);
            throw error;
        }
    },

    /**
     * Get car wash by ID
     */
    async getCarwashById(id: string): Promise<Carwash> {
        try {
            const response = await axios.get(`${API_BASE_URL}/carwashes/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Get carwash error:', error);
            throw error;
        }
    },

    /**
     * Search nearby car washes
     */
    async searchNearby(lat: number, lng: number): Promise<any> {
        try {
            const response = await axios.get(`${API_BASE_URL}/carwashes/nearby/?lat=${lat}&lng=${lng}`);
            console.log('Response from searchNearby:', response.data);

            // Backend returns {success: true, data: {data: {carwashes: [...], count: 2, ...}, message: '...'}}
            // So we need to go deeper: response.data.data.data.carwashes
            let data = response.data.data || response.data;
            console.log('First level data:', data);

            // Check if there's another nested 'data' property
            if (data.data) {
                data = data.data;
                console.log('Second level data:', data);
            }

            const carwashes = data.carwashes || [];
            console.log('Extracted carwashes array:', carwashes);
            return carwashes;
        } catch (error: any) {
            console.error('Search nearby error:', error);
            return []; // Return empty array instead of throwing
        }
    },

    /**
     * Create a new carwash (Business Onboarding)
     * Sends JSON data. File uploads are currently not supported by the backend in this endpoint.
     */
    async createCarwash(data: any): Promise<Carwash> {
        try {
            const token = localStorage.getItem('authToken'); // Retrieve the token
            if (!token) {
                toast.error("You are not logged in. Please log in to continue.");
                throw new Error("Authentication token not found.");
            }

            const response = await axios.post(`${API_BASE_URL}/carwashes`, data, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    // Add the Authorization header with the Bearer token
                    'Authorization': `Bearer ${token}`,
                },
            });
            toast.success("Carwash business created successfully!");
            return response.data;
        } catch (error: any) {
            console.error('Create carwash error:', error);
            const errorMessage = error.response?.data?.error || "Failed to create carwash business";
            toast.error(errorMessage);
            throw error;
        }
    },

    /**
     * Get carwashes by owner ID
     */
    async getCarwashByOwnerId(ownerId: string): Promise<Carwash[]> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                toast.error("You are not logged in. Please log in to continue.");
                throw new Error("Authentication token not found.");
            }

            const response = await axios.get(`${API_BASE_URL}/carwashes/owner/${ownerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('Get carwash by owner error:', error);
            throw error;
        }
    },

    /**
     * Upload photos for a carwash
     */
    async uploadCarwashPhotos(carwashId: string, photos: File[]): Promise<void> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Authentication token not found.");

            const uploadPromises = photos.map(photo => {
                const formData = new FormData();
                formData.append('photo', photo);

                return axios.post(`${API_BASE_URL}/carwashes/${carwashId}/photos`, formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }
                });
            });

            await Promise.all(uploadPromises);
            toast.success("Photos uploaded successfully!");
        } catch (error: any) {
            console.error('Upload photos error:', error);
            toast.error("Failed to upload photos");
            throw error;
        }
    },

    /**
     * Update carwash information
     */
    async updateCarwash(carwashId: string, data: Partial<Carwash>): Promise<Carwash> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                toast.error("You are not logged in. Please log in to continue.");
                throw new Error("Authentication token not found.");
            }

            const response = await axios.put(`${API_BASE_URL}/carwashes/${carwashId}`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            toast.success("Carwash updated successfully!");
            return response.data;
        } catch (error: any) {
            console.error('Update carwash error:', error);
            const errorMessage = error.response?.data?.error || "Failed to update carwash";
            toast.error(errorMessage);
            throw error;
        }
    },

    /**
     * Delete a photo from carwash gallery
     */
    async deleteCarwashPhoto(carwashId: string, photoUrl: string): Promise<void> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Authentication token not found.");

            await axios.delete(`${API_BASE_URL}/carwashes/${carwashId}/photos`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                data: { photo_url: photoUrl }
            });

            toast.success("Photo deleted successfully!");
        } catch (error: any) {
            console.error('Delete photo error:', error);
            toast.error("Failed to delete photo");
            throw error;
        }
    }
};

export default CarwashService;
