import axios from 'axios';
import API_BASE_URL from './baseUrl';

export interface Notification {
    id: string;
    user_id: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

const NotificationService = {
    /**
     * Get all notifications for the current user
     */
    async getMyNotifications(): Promise<Notification[]> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Authentication token not found.");

            const response = await axios.get(`${API_BASE_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Handle double-wrap if present
            const data = response.data.data?.data || response.data.data || response.data;
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Fetch notifications error:', error);
            return [];
        }
    },

    /**
     * Get unread notification count
     */
    async getUnreadCount(): Promise<number> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return 0;

            const response = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data.data?.count || response.data.count || 0;
        } catch (error) {
            console.error('Fetch unread count error:', error);
            return 0;
        }
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(id: string): Promise<void> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            await axios.put(`${API_BASE_URL}/notifications/${id}/read`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            await axios.put(`${API_BASE_URL}/notifications/mark-all-read`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Mark all as read error:', error);
        }
    }
};

export default NotificationService;
