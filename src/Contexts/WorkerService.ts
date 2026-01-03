import axios from "axios";
import BASE_URL from "./baseUrl";

export interface Worker {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string;
    job_role: string;
    worker_status: string;
    profile_photo?: string;
    active_orders?: string[];
    carwash_id?: string;
}

// Helper to get auth headers with correct token key
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error("WorkerService: No 'authToken' found in localStorage");
        return { 'Content-Type': 'application/json' };
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const WorkerService = {
    getWorkers: async (carwash_id: string): Promise<Worker[]> => {
        const response = await axios.get(`${BASE_URL}/workers/business/${carwash_id}`, {
            headers: getAuthHeaders(),
        });

        // Handle both direct array and wrapped data object
        const rawData = response.data.data || response.data;
        if (rawData && rawData.data && Array.isArray(rawData.data)) {
            return rawData.data;
        }
        return Array.isArray(rawData) ? rawData : [];
    },

    createWorker: async (workerData: Partial<Worker>): Promise<Worker> => {
        const response = await axios.post(`${BASE_URL}/workers/create`, workerData, {
            headers: getAuthHeaders(),
        });
        return response.data.data;
    },

    updateWorkerStatus: async (workerId: string, status: string): Promise<void> => {
        await axios.patch(`${BASE_URL}/workers/work-status/${workerId}`, { work_status: status }, {
            headers: getAuthHeaders(),
        });
    },

    assignWorker: async (bookingId: string, workerId: string): Promise<void> => {
        await axios.post(`${BASE_URL}/workers/assign`, { order_id: bookingId, worker_id: workerId }, {
            headers: getAuthHeaders(),
        });
    },

    updateWorker: async (workerId: string, workerData: Partial<Worker>): Promise<void> => {
        await axios.put(`${BASE_URL}/workers/${workerId}`, workerData, {
            headers: getAuthHeaders(),
        });
    },

    uploadWorkerPhoto: async (workerId: string, photo: File): Promise<string> => {
        const formData = new FormData();
        formData.append('photo', photo);

        const token = localStorage.getItem('authToken');
        const response = await axios.post(`${BASE_URL}/workers/${workerId}/photo`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            },
        });
        return response.data.url;
    }
};

export default WorkerService;
