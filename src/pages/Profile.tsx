import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  User,
  MapPin,
  Bell,
  Shield,
  LogOut,
  Check,
} from "lucide-react";
import UserService, { UserProfile } from "@/Contexts/UserService";
import { useAuth } from "@/Contexts/AuthContext";

// Child Components
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { AddressManager } from "@/components/profile/AddressManager";
import { NotificationSettings } from "@/components/profile/NotificationSettings";
import { SecuritySettings } from "@/components/profile/SecuritySettings";
import { AccountSettings } from "@/components/profile/AccountSettings";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const Profile = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Define tabs with dynamic badges
  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "addresses", label: "Addresses", icon: MapPin, badge: user?.addresses?.length },
    // { id: "payments", label: "Payment Methods", icon: CreditCard }, // Coming Soon
    // { id: "notifications", label: "Notifications", icon: Bell }, // Hidden for MVP Demo
    // { id: "security", label: "Security", icon: Shield }, // Hidden for MVP Demo
    // { id: "account", label: "Account", icon: LogOut }, // Hidden for MVP Demo
  ];

  useEffect(() => {
    if (authUser?.id) {
      fetchUserProfile(authUser.id);
    }
  }, [authUser]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      const profile = await UserService.getUserProfile(userId);

      // Set default values / enrich data
      const enrichedProfile: UserProfile = {
        ...profile,
        notifications: profile.notifications || {
          email: true,
          sms: true,
          push: true,
          bookingUpdates: true,
          promotions: false,
          newsletter: false,
        },
        accountCreated: profile.accountCreated || new Date().toISOString(),
        totalBookings: profile.totalBookings || 0,
      };

      setUser(enrichedProfile);
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Callback to update parent state from children
  const handleUserUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Fallback if user is null
  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account preferences and addresses</p>
          </div>
          <Badge variant="outline" className="gap-2 text-[#10B981] bg-emerald-50 border-emerald-200">
            <Check className="h-4 w-4" />
            Up to date
          </Badge>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              <Card className="shadow-sm border-muted overflow-hidden">
                <CardContent className="p-0 flex lg:flex-col overflow-x-auto no-scrollbar lg:overflow-x-visible">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant="ghost"
                      className={cn(
                        "flex-1 lg:w-full justify-center lg:justify-start px-6 lg:px-4 py-5 lg:py-4 text-center lg:text-left gap-2 lg:gap-3 transition-all rounded-none whitespace-nowrap border-b-2 lg:border-b-0 lg:border-l-4",
                        activeTab === tab.id
                          ? "bg-primary/5 lg:bg-primary/10 text-primary border-primary font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
                      )}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <tab.icon className="h-4 w-4 lg:h-5 lg:w-5" />
                      <span className="text-sm lg:text-base">{tab.label}</span>
                      {tab && tab.badge !== undefined && tab.badge > 0 && (
                        <Badge variant="outline" className="ml-1 lg:ml-auto bg-white text-[10px] h-4 px-1">
                          {tab.badge}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {activeTab === "personal" && (
              <ProfileInfo user={user} onUpdate={handleUserUpdate} />
            )}

            {activeTab === "addresses" && (
              <AddressManager user={user} onUpdate={handleUserUpdate} />
            )}

            {activeTab === "notifications" && (
              <NotificationSettings user={user} />
            )}

            {activeTab === "security" && (
              <SecuritySettings />
            )}

            {activeTab === "account" && (
              <AccountSettings user={user} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;