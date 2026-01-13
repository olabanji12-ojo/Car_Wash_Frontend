import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NotificationService from "@/Contexts/NotificationService";
import { useAuth } from "@/Contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Clock, Check, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const NotificationsPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch Notifications with Polling
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ["notifications"],
        queryFn: () => NotificationService.getMyNotifications(),
        refetchInterval: 10000, // Poll every 10s for the full list
        enabled: !!user,
    });

    const markReadMutation = useMutation({
        mutationFn: (id: string) => NotificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => NotificationService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    const unreadCount = Array.isArray(notifications)
        ? notifications.filter((n: any) => !n.is_read).length
        : 0;

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto max-w-3xl py-8 px-4">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-7">
                        <CardTitle className="text-2xl font-black flex items-center gap-2">
                            <Bell className="h-6 w-6 text-primary" />
                            Notifications
                            {unreadCount > 0 && (
                                <Badge variant="destructive" className="ml-2 font-black shadow-lg shadow-red-100">
                                    {unreadCount} NEW
                                </Badge>
                            )}
                        </CardTitle>
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto rounded-full border-2 font-black h-10 px-6 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                onClick={() => markAllReadMutation.mutate()}
                                disabled={markAllReadMutation.isPending}
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Mark all as read
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {Array.isArray(notifications) && notifications.length > 0 ? (
                                notifications.map((notif: any, index: number) => (
                                    <div key={notif.id}>
                                        <div
                                            className={cn(
                                                "flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl transition-all duration-300",
                                                !notif.is_read ? "bg-blue-50/30 border-l-4 border-blue-600 shadow-sm" : "hover:bg-muted/50"
                                            )}
                                        >
                                            <div className={`p-2.5 rounded-xl mt-1 flex-shrink-0 ${!notif.is_read ? "bg-blue-100 text-blue-600 shadow-inner" : "bg-gray-100 text-gray-400"}`}>
                                                <Bell className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className={`text-sm sm:text-base ${!notif.is_read ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                                                        {notif.message}
                                                    </p>
                                                    {!notif.is_read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-blue-600 h-unset py-1 px-2"
                                                            onClick={() => markReadMutation.mutate(notif.id)}
                                                        >
                                                            Mark as read
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{new Date(notif.created_at).toLocaleString()}</span>
                                                    {!notif.is_read && <span className="text-blue-500 font-medium">• New Notification</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {index < notifications.length - 1 && <Separator className="my-1 opacity-50" />}
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                                        <Bell className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No notifications yet</h3>
                                    <p className="text-sm text-gray-500 mt-1">We'll let you know when something important happens.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default NotificationsPage;
