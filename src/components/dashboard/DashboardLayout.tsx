import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { BottomNav } from "@/components/mobile/BottomNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-4 pb-24 md:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          <BottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
};
