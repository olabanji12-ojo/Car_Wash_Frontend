import axios from 'axios';
import { toast } from 'sonner';
import API_BASE_URL from './baseUrl';

// NEW INTERFACE for paginated response - Adjusted for safer handling
export interface PaginatedCarwashes {
    data: Carwash[];
    totalCount: number;
    // We add 'success' here as the backend returns it at the top level
    success?: boolean;
}

export interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number; // Duration in minutes
    features?: string[];
}

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
    services: Service[];
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
    distance_km?: number;
    distance_text?: string;
    home_service?: boolean;
    delivery_radius_km?: number;
    search_mode?: 'station' | 'home';
    base_price?: number;
    // Add other fields as needed
}

const CarwashService = {
    /**
     * Get all active car washes with pagination
     * @param page The page number to fetch (default 1)
     * @param limit The number of items per page (default 10)
     */
    async getAllCarwashes(page: number = 1, limit: number = 10): Promise<PaginatedCarwashes> {
        try {
            // Include page and limit query parameters for the server
            const response = await axios.get(`${API_BASE_URL}/carwashes?page=${page}&limit=${limit}`);

            console.log(`Response from getAllCarwashes (Page ${page}):`, response.data);

            // Access the response body. 
            const responseBody = response.data;

            // CRITICAL FIX: Extract the carwash array and count from the nested data structure
            // We assume the carwash array is at responseBody.data 
            // and the count is at responseBody.totalCount or responseBody.count
            const carwashesArray = responseBody.data || [];
            const count = responseBody.totalCount || responseBody.count ||
                (Array.isArray(carwashesArray) ? carwashesArray.length : 0);

            return {
                data: carwashesArray, // Returns the actual array of carwashes
                totalCount: count
            };
        } catch (error: any) {
            console.error('Get all carwashes error:', error);
            // Use toast.error here as well for consistency
            toast.error("Failed to load carwash list.");
            // Return empty data structure on error
            return { data: [], totalCount: 0 };
        }
    },

    /**
     * Get car wash by ID
     */
    async getCarwashById(id: string): Promise<Carwash> {
        try {
            const response = await axios.get(`${API_BASE_URL}/carwashes/${id}`);
            // Check if response has a nested data property and use it
            return response.data.data || response.data;
        } catch (error: any) {
            console.error('Get carwash error:', error);
            throw error;
        }
    },

    /**
     * Search nearby car washes
     */
    async searchNearby(lat: number, lng: number): Promise<Carwash[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/carwashes/nearby?lat=${lat}&lng=${lng}`);
            console.log('Response from searchNearby:', response.data);

            let carwashesArray: Carwash[] = [];
            const data = response.data;

            // 1. Try to find 'carwashes' at any level (response.data.data.data.carwashes or response.data.data.carwashes)
            if (data?.data?.data?.carwashes) {
                carwashesArray = data.data.data.carwashes;
            } else if (data?.data?.carwashes) {
                carwashesArray = data.data.carwashes;
            } else if (data?.carwashes) {
                carwashesArray = data.carwashes;
            }
            // 2. Fallback check (data directly holds the array or data.data holds it)
            else if (Array.isArray(data?.data)) {
                carwashesArray = data.data;
            } else if (Array.isArray(data)) {
                carwashesArray = data;
            }

            console.log('Extracted carwashes array:', carwashesArray);
            return carwashesArray;
        } catch (error: any) {
            console.error('Search nearby error:', error);
            return [];
        }
    },

    // ... (rest of the functions remain the same as they are not affected by this specific issue)

    /**
     * Create a new carwash (Business Onboarding)
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
                    'Authorization': `Bearer ${token}`,
                },
            });
            toast.success("Carwash business created successfully!");
            // Extract the carwash object from the standard API wrapper ({success: true, data: {...}})
            return response.data.data || response.data;
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

            // Assuming this endpoint returns an array or an object with a data array
            return Array.isArray(response.data) ? response.data : response.data.data || [];
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
            return response.data.data || response.data;
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