import { Home, Search, Calendar, BookOpen, Heart, Car, ClipboardList, Star, Settings, Bell } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/Contexts/AuthContext";

const customerMenuItems = [
  { title: "Home Website", url: "/", icon: Car },
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Search Carwashes", url: "/carwashes", icon: Search },
  { title: "My Bookings", url: "/dashboard/bookings", icon: BookOpen },
  { title: "Favorites", url: "/dashboard/favorites", icon: Heart },
  { title: "My Vehicles", url: "/dashboard/vehicles", icon: Car },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

const guestMenuItems = [
  { title: "Home Website", url: "/", icon: Car },
  { title: "Find a Carwash", url: "/carwashes", icon: Search },
  { title: "Login", url: "/login", icon: BookOpen }, // Using BookOpen as a generic 'Action' icon for now, or could change
  { title: "Sign Up", url: "/signup", icon: Heart }, // Using Heart as generic
];

const businessMenuItems = [
  { title: "Home Website", url: "/", icon: Car },
  { title: "Business Dashboard", url: "/business-dashboard", icon: Home },
  { title: "Bookings", url: "/bookings-management", icon: ClipboardList },
  { title: "Reviews", url: "/reviews-management", icon: Star },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/business-profile-settings", icon: Settings },
];

export function DashboardSidebar() {
  const { open } = useSidebar();
  const { user } = useAuth();

  let menuItems = guestMenuItems;
  if (user) {
    menuItems = user.role === 'business_owner' ? businessMenuItems : customerMenuItems;
  }

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border/50 bg-background/80 backdrop-blur-md">
      <SidebarContent>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            QueueLess
          </h1>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-6 py-3 transition-all duration-200 rounded-md mx-2 ${isActive
                          ? "bg-primary/10 text-primary font-bold shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
