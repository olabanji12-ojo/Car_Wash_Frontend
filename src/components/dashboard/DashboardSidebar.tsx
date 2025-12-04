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
  {title:"Welcompage", url:"/", icon: Car},
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
    <Sidebar collapsible="offcanvas">
      <SidebarContent className="bg-primary">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-foreground">
            CarWashPro
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
                        `flex items-center gap-3 px-6 py-3 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors ${
                          isActive ? "bg-primary-foreground/20 text-primary-foreground font-medium" : ""
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
