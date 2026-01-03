import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NotificationService from "@/Contexts/NotificationService";
import { Bell, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/Contexts/AuthContext";

export const NotificationBar = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Only fetch for customers
    const { data: notifications = [] } = useQuery({
        queryKey: ["notifications"],
        queryFn: () => NotificationService.getMyNotifications(),
        refetchInterval: 5000,
        enabled: !!user && user.role === 'car_owner',
    });

    const markReadMutation = useMutation({
        mutationFn: (id: string) => NotificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    const unreadNotifications = notifications.filter((n: any) => !n.is_read);

    if (unreadNotifications.length === 0) return null;

    // Show the most recent unread notification
    const latestNotif = unreadNotifications[0];

    return (
        <div className="bg-blue-600 text-white py-2 px-4 shadow-md sticky top-16 z-20 animate-in slide-in-from-top duration-300">
            <div className="container mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <Bell className="h-5 w-5 flex-shrink-0 animate-bounce" />
                    <p className="text-sm font-medium truncate">
                        {latestNotif.message}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-blue-700 h-8 px-2"
                        onClick={() => markReadMutation.mutate(latestNotif.id)}
                    >
                        <Check className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Mark as read</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-blue-700 h-8 w-8 p-0"
                        onClick={() => markReadMutation.mutate(latestNotif.id)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
