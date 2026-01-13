import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, User, Star, ClipboardList, Heart } from "lucide-react";
import { useAuth } from "@/Contexts/AuthContext";
import { motion } from "framer-motion";

export const BottomNav = () => {
    const { user } = useAuth();
    const location = useLocation();

    const customerItems = [
        { title: "Home", url: "/dashboard", icon: Home },
        { title: "Bookings", url: "/dashboard/bookings", icon: Calendar },
        { title: "Favorites", url: "/dashboard/favorites", icon: Heart },
        { title: "Profile", url: "/profile", icon: User },
    ];

    const businessItems = [
        { title: "Home", url: "/business-dashboard", icon: Home },
        { title: "Bookings", url: "/bookings-management", icon: ClipboardList },
        { title: "Reviews", url: "/reviews-management", icon: Star },
        { title: "Profile", url: "/profile", icon: User },
    ];

    const navItems = user?.role === 'business_owner' ? businessItems : customerItems;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background to-transparent h-24 pointer-events-none" />
            <div className="relative mx-4 mb-6 px-2 py-2 bg-background/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.url || (item.url === "/dashboard" && location.pathname === "/dashboard/");

                    return (
                        <NavLink
                            key={item.title}
                            to={item.url}
                            end={item.url === "/dashboard"}
                            className="relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors outline-none"
                        >
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className={`relative z-10 flex flex-col items-center justify-center ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <item.icon
                                    className="h-5 w-5"
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className={`text-[10px] font-semibold tracking-tight ${isActive ? "opacity-100" : "opacity-70"
                                    }`}>
                                    {item.title}
                                </span>
                            </motion.div>

                            {isActive && (
                                <motion.div
                                    layoutId="active-tab"
                                    className="absolute -inset-x-1 inset-y-0.5 bg-primary/10 rounded-xl -z-0"
                                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                                />
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};
