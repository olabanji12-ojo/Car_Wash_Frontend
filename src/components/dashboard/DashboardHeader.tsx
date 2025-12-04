import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
 
export const DashboardHeader = () => {
  const navigate = useNavigate();
  return (
    <header className="h-16 border-b bg-card flex items-center px-4 md:px-6">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="md:hidden" />
        <div className="flex-1" />
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon"
         onClick={() => navigate(`/profile`)}
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
