import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, User, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "../../Contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NotificationService from "@/Contexts/NotificationService";
import { Badge } from "@/components/ui/badge";
import { Clock, Check } from "lucide-react";

export const DashboardHeader = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch Notifications with Polling
    const { data: notifications = [] } = useQuery({
        queryKey: ["notifications"],
        queryFn: () => NotificationService.getMyNotifications(),
        refetchInterval: 5000,
        enabled: !!user,
    });

    const unreadCount = Array.isArray(notifications)
        ? notifications.filter((n: any) => !n.is_read).length
        : 0;

    const markReadMutation = useMutation({
        mutationFn: (id: string) => NotificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        markReadMutation.mutate(id);
    };

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
            <div className="flex flex-1 items-center gap-4">
                {/* Sidebar Trigger - Visible on mobile when sidebar is off-canvas */}
                <SidebarTrigger />

                {/* Site Title/Logo for Mobile screens only */}
                <h1 className="text-xl font-bold md:hidden bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    QueueLess
                </h1>

                {/* Spacer to push items to the right */}
                <div className="flex-1" />

                {/* Notifications Button with Dropdown */}
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-background">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                        {unreadCount} New
                                    </Badge>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[300px] overflow-y-auto">
                                {Array.isArray(notifications) && notifications.length > 0 ? (
                                    notifications.slice(0, 5).map((notif: any) => (
                                        <DropdownMenuItem
                                            key={notif.id}
                                            className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => navigate('/notifications')}
                                        >
                                            <div className="flex w-full items-start justify-between gap-2">
                                                <p className={`text-xs leading-none ${!notif.is_read ? 'font-semibold' : ''}`}>
                                                    {notif.message}
                                                </p>
                                                {!notif.is_read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4 h-unset p-0 text-blue-600 hover:text-blue-800"
                                                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span>{new Date(notif.created_at).toLocaleString()}</span>
                                            </div>
                                        </DropdownMenuItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-xs text-muted-foreground">
                                        No notifications yet
                                    </div>
                                )}
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="w-full justify-center text-xs font-medium text-blue-600 cursor-pointer"
                                onClick={() => navigate('/notifications')}
                            >
                                View all notifications
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full border bg-muted/50 hover:bg-muted">
                                <User className="h-5 w-5" />
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.email || "user@example.com"}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/profile`)} className="cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span>My Account</span>
                            </DropdownMenuItem>
                            {user.role === 'business_owner' && (
                                <DropdownMenuItem onClick={() => navigate(`/business-profile-settings`)} className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Business Settings</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => navigate("/login")}>Log in</Button>
                        <Button onClick={() => navigate("/signup")}>Sign up</Button>
                    </div>
                )}
            </div>
        </header>
    );
};