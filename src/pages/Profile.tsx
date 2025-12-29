import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "account", label: "Account", icon: LogOut },
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
            <Card className="sticky top-24 shadow-sm border-muted">
              <CardContent className="p-0">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    className={`w-full justify-start px-4 py-4 text-left gap-3 transition-all ${activeTab === tab.id
                      ? "bg-primary/10 text-primary border-l-4 border-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                    {tab && tab.badge !== undefined && tab.badge > 0 && (
                      <Badge variant="outline" className="ml-auto bg-white">
                        {tab.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </CardContent>
            </Card>
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