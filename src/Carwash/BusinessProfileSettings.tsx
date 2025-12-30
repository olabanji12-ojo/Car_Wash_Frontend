import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  User,
  Clock,
  DollarSign,
  Upload,
  Trash2,
  Bell,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

// Define TypeScript interface for payoutMethod
interface PayoutMethod {
  type: "bank" | "mobile" | "";
  bankName?: string;
  accountNumber?: string;
  mobileProvider?: string;
  mobileNumber?: string;
}

// Define TypeScript interface for business data
interface BusinessData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  photos: { id: string; url: string }[];
  hours: { day: string; open: string; close: string; closed: boolean }[];
  maxCarsPerSlot: number;
  payoutMethod: PayoutMethod;
  notifications: { email: boolean; sms: boolean; push: boolean };
}

// Mock data - updated to match interface
const mockBusinessData: BusinessData = {
  name: "Sparkle Carwash",
  description: "Premium car care with eco-friendly products",
  address: "123 Main Street, Lagos, Nigeria",
  phone: "+234 801 234 5678",
  email: "owner@carwash.com",
  photos: [
    { id: "1", url: "https://res.cloudinary.com/dhgkmjnvl/image/upload/v1760369867/tote-bags/totebag26.jpg" },
    { id: "2", url: "https://res.cloudinary.com/dhgkmjnvl/image/upload/v1760369859/tote-bags/totebag2.jpg" },
  ],
  hours: [
    { day: "Monday", open: "08:00", close: "20:00", closed: false },
    { day: "Tuesday", open: "08:00", close: "20:00", closed: false },
    { day: "Wednesday", open: "08:00", close: "20:00", closed: false },
    { day: "Thursday", open: "08:00", close: "20:00", closed: false },
    { day: "Friday", open: "08:00", close: "20:00", closed: false },
    { day: "Saturday", open: "08:00", close: "20:00", closed: false },
    { day: "Sunday", open: "08:00", close: "20:00", closed: true },
  ],
  maxCarsPerSlot: 5,
  payoutMethod: {
    type: "bank",
    bankName: "First Bank",
    accountNumber: "1234567890",
  },
  notifications: {
    email: true,
    sms: false,
    push: true,
  },
};

const BusinessProfileSettings = () => {
  const navigate = useNavigate();
  /* Removed for MVP Demo: "payout-methods" | "notifications" | "account" */
  const [activeTab, setActiveTab] = useState<"business-info" | "hours">("business-info");
  const [businessData, setBusinessData] = useState<BusinessData>(mockBusinessData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [carwashId, setCarwashId] = useState<string>('');

  useEffect(() => {
    const fetchCarwashData = async () => {
      try {
        setIsLoading(true);
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          toast.error("Please log in to view settings");
          navigate('/login');
          return;
        }

        const user = JSON.parse(storedUser);
        if (!user.carwash_id) {
          toast.error("No carwash found for this account");
          setIsLoading(false);
          return;
        }

        setCarwashId(user.carwash_id);
        const { default: CarwashService } = await import('@/Contexts/CarwashService');
        const carwashResponse = await CarwashService.getCarwashById(user.carwash_id);
        const carwashData = (carwashResponse as any).data || carwashResponse;

        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const transformedHours = daysOfWeek.map(day => {
          const dayLower = day.toLowerCase();
          const hourData = carwashData.open_hours?.[dayLower];
          return {
            day,
            open: hourData?.start || '08:00',
            close: hourData?.end || '20:00',
            closed: !hourData || hourData.start === '' || hourData.end === ''
          };
        });

        setBusinessData({
          name: carwashData.name || '',
          description: carwashData.description || '',
          address: carwashData.address || '',
          phone: carwashData.phone || user.phone || '',
          email: user.email || '',
          photos: (carwashData.photo_gallery || []).map((url: string, index: number) => ({ id: `${index}`, url })),
          hours: transformedHours,
          maxCarsPerSlot: carwashData.max_cars_per_slot || 1,
          payoutMethod: { type: '', bankName: '', accountNumber: '' },
          notifications: { email: true, sms: false, push: true },
        });
      } catch (error) {
        console.error('Failed to fetch carwash data:', error);
        toast.error("Failed to load business settings");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCarwashData();
  }, [navigate]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { default: CarwashService } = await import('@/Contexts/CarwashService');
      let updateData: any = {};

      if (activeTab === "business-info" || activeTab === "hours") {
        const openHoursMap: Record<string, { start: string; end: string }> = {};
        businessData.hours.forEach(h => {
          if (!h.closed) openHoursMap[h.day.toLowerCase()] = { start: h.open, end: h.close };
        });

        if (activeTab === "business-info") {
          updateData = {
            name: businessData.name,
            description: businessData.description,
            address: businessData.address,
            open_hours: openHoursMap,
            max_cars_per_slot: businessData.maxCarsPerSlot,
          };
          if (photos.length > 0) {
            await CarwashService.uploadCarwashPhotos(carwashId, photos);
            setPhotos([]);
          }
        } else {
          updateData = { open_hours: openHoursMap };
        }
      }

      await CarwashService.updateCarwash(carwashId, updateData);
      toast.success("Changes saved successfully");
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(f => f.size <= 5 * 1024 * 1024 && ["image/jpeg", "image/png"].includes(f.type));
      if (validFiles.length + businessData.photos.length + photos.length > 5) {
        toast.error("Maximum 5 photos allowed");
        return;
      }
      setPhotos([...photos, ...validFiles]);
    }
  };

  const handleDeletePhoto = async (id: string | number) => {
    try {
      if (typeof id === 'string') {
        const photoToDelete = businessData.photos.find(p => p.id === id);
        if (photoToDelete) {
          const { default: CarwashService } = await import('@/Contexts/CarwashService');
          await CarwashService.deleteCarwashPhoto(carwashId, photoToDelete.url);
          setBusinessData({ ...businessData, photos: businessData.photos.filter(p => p.id !== id) });
        }
      } else {
        setPhotos(photos.filter((_, index) => index !== id));
      }
    } catch (error) {
      toast.error("Failed to delete photo");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-4 space-y-2">
                {[
                  { id: "business-info", label: "Business Info", icon: User },
                  { id: "hours", label: "Operating Hours", icon: Clock },
                  // { id: "payout-methods", label: "Payout Methods", icon: DollarSign }, // Hidden for MVP
                  // { id: "notifications", label: "Notifications", icon: Bell }, // Hidden for MVP
                  // { id: "account", label: "Account Actions", icon: AlertTriangle }, // Hidden for MVP
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveTab(tab.id as any)}
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "business-info" && "Business Information"}
                  {activeTab === "hours" && "Operating Hours"}
                  {/* {activeTab === "payout-methods" && "Payout Methods"} */}
                  {/* {activeTab === "notifications" && "Notification Preferences"} */}
                  {/* {activeTab === "account" && "Account Actions"} */}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeTab === "business-info" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Business Name</Label>
                      <Input id="name" value={businessData.name} onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" value={businessData.description} onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })} rows={4} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" value={businessData.address} onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" value={businessData.phone} onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Photos</Label>
                      <input type="file" accept="image/*" multiple className="hidden" id="photo-upload" onChange={handlePhotoUpload} />
                      <label htmlFor="photo-upload" className="bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 inline-flex gap-2"><Upload className="h-4 w-4" />Upload Photos</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                        {businessData.photos.map(p => (
                          <div key={p.id} className="relative">
                            <img src={p.url} className="w-full h-32 object-cover rounded-md" />
                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 text-red-500" onClick={() => handleDeletePhoto(p.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                        {photos.map((p, i) => (
                          <div key={i} className="relative">
                            <img src={URL.createObjectURL(p)} className="w-full h-32 object-cover rounded-md" />
                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 text-red-500" onClick={() => handleDeletePhoto(i)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxCarsPerSlot">Max Cars Per Slot</Label>
                      <Input id="maxCarsPerSlot" type="number" value={businessData.maxCarsPerSlot} onChange={(e) => setBusinessData({ ...businessData, maxCarsPerSlot: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                )}

                {/* {activeTab === "account" && (
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/logout")}><LogOut className="h-5 w-5" />Log Out</Button>
                  </div>
                )} */}

                {/* Always show save button for the remaining tabs */}
                <Button className="mt-4" onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BusinessProfileSettings;