import { NavLink } from "react-router-dom";
import { Home, Search, Calendar, User } from "lucide-react";

export const BottomNav = () => {
    const navItems = [
        { title: "Home", url: "/dashboard", icon: Home },
        { title: "Search", url: "/dashboard/find", icon: Search },
        { title: "My Bookings", url: "/dashboard/bookings", icon: Calendar },
        { title: "Profile", url: "/profile", icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/50 md:hidden pb-safe">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.title}
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5" strokeWidth={2.5} />
                        <span className="text-[10px] font-medium">{item.title}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    );
};
