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

export const DashboardHeader = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

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

                {/* Notifications Button */}
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                </Button>

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