import { Home, Search, Calendar, BookOpen, Heart, Car } from "lucide-react";
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

const menuItems = [
  { title: "Home Website", url: "/", icon: Car },
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Find Carwash", url: "/dashboard/find", icon: Search },
  { title: "Book Home Service", url: "/dashboard/book", icon: Calendar },
  { title: "My Bookings", url: "/dashboard/bookings", icon: BookOpen },
  { title: "Favorites", url: "/dashboard/favorites", icon: Heart },
  { title: "My Vehicles", url: "/dashboard/vehicles", icon: Car },
];

export function DashboardSidebar() {
  const { open } = useSidebar();

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
