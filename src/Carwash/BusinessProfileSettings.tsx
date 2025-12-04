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
  MapPin,
  Clock,
  DollarSign,
  Upload,
  Trash2,
  Bell,
  LogOut,
  AlertTriangle,
} from "lucide-react";

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
    mobileProvider: undefined,
    mobileNumber: undefined,
  },
  notifications: {
    email: true,
    sms: false,
    push: true,
  },
};

const BusinessProfileSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"business-info" | "hours" | "payout-methods" | "notifications" | "account">("business-info");
  const [businessData, setBusinessData] = useState<BusinessData>(mockBusinessData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [carwashId, setCarwashId] = useState<string>('');

  // ✅ PROCESS 2.1: Fetch real carwash data
  useEffect(() => {
    const fetchCarwashData = async () => {
      try {
        setIsLoading(true);

        // Get carwash_id from localStorage
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
        console.log('📋 Fetching carwash data for:', user.carwash_id);

        // Import CarwashService dynamically
        const { default: CarwashService } = await import('@/Contexts/CarwashService');
        const carwashResponse = await CarwashService.getCarwashById(user.carwash_id);


        console.log('✅ Carwash data fetched:', carwashResponse);

        // Transform backend data to match BusinessData interface
        // Note: getCarwashById returns the carwash object directly or wrapped in {data: carwash}
        const carwashData = (carwashResponse as any).data || carwashResponse;


        // Transform operating hours from backend format
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
          photos: (carwashData.photo_gallery || []).map((url: string, index: number) => ({
            id: `${index}`,
            url
          })),
          hours: transformedHours,
          maxCarsPerSlot: carwashData.max_cars_per_slot || 1, // Default to 1 if not set
          payoutMethod: {
            type: '',
            bankName: '',
            accountNumber: '',
          },
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
        });

        console.log('✅ Business data set successfully');
      } catch (error) {
        console.error('❌ Failed to fetch carwash data:', error);
        toast.error("Failed to load business settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarwashData();
  }, [navigate]);

  // ✅ PROCESS 2.2 & 2.3: Save changes to backend
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setIsSaving(true);
      console.log('💾 Saving changes for carwash:', carwashId);

      const { default: CarwashService } = await import('@/Contexts/CarwashService');

      // Prepare update data based on active tab
      let updateData: any = {};

      if (activeTab === "business-info") {
        // Transform hours back to backend format
        const openHoursMap: Record<string, { start: string; end: string }> = {};
        businessData.hours.forEach(h => {
          if (!h.closed) {
            openHoursMap[h.day.toLowerCase()] = { start: h.open, end: h.close };
          }
        });

        updateData = {
          name: businessData.name,
          description: businessData.description,
          address: businessData.address,
          open_hours: openHoursMap,
          max_cars_per_slot: businessData.maxCarsPerSlot,
        };

        // Upload new photos if any
        if (photos.length > 0) {
          console.log('📸 Uploading', photos.length, 'new photos...');
          await CarwashService.uploadCarwashPhotos(carwashId, photos);
          setPhotos([]); // Clear uploaded photos
        }
      } else if (activeTab === "hours") {
        // Transform hours back to backend format
        const openHoursMap: Record<string, { start: string; end: string }> = {};
        businessData.hours.forEach(h => {
          if (!h.closed) {
            openHoursMap[h.day.toLowerCase()] = { start: h.open, end: h.close };
          }
        });

        updateData = {
          open_hours: openHoursMap,
        };
      }

      // Update carwash
      await CarwashService.updateCarwash(carwashId, updateData);
      console.log('✅ Changes saved successfully');

      setIsSaving(false);
      toast.success("Changes saved successfully", { style: { color: "#10B981" } });
    } catch (error) {
      console.error('❌ Failed to save changes:', error);
      setIsSaving(false);
      toast.error("Failed to save changes");
    }
  };

  const validateForm = () => {
    if (activeTab === "business-info") {
      return businessData.name && businessData.address;
    }
    if (activeTab === "payout-methods") {
      if (businessData.payoutMethod.type === "bank") {
        return businessData.payoutMethod.bankName && businessData.payoutMethod.accountNumber;
      }
      if (businessData.payoutMethod.type === "mobile") {
        return businessData.payoutMethod.mobileProvider && businessData.payoutMethod.mobileNumber;
      }
    }
    return true;
  };

  // ✅ PROCESS 2.4: Handle photo upload (prepare for upload on save)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(
        (file) => file.size <= 5 * 1024 * 1024 && ["image/jpeg", "image/png"].includes(file.type)
      );
      if (validFiles.length + businessData.photos.length + photos.length > 5) {
        toast.error("Maximum 5 photos allowed");
        return;
      }
      setPhotos([...photos, ...validFiles]);
      toast.success(`${validFiles.length} photo(s) ready to upload. Click "Save Changes" to upload.`);
    }
  };

  // ✅ PROCESS 2.5: Delete photo from backend
  const handleDeletePhoto = async (id: string | number) => {
    try {
      // Check if it's an existing photo (string id) or new photo (number index)
      if (typeof id === 'string') {
        // Existing photo - delete from backend
        const photoToDelete = businessData.photos.find(p => p.id === id);
        if (photoToDelete) {
          console.log('🗑️ Deleting photo:', photoToDelete.url);
          const { default: CarwashService } = await import('@/Contexts/CarwashService');
          await CarwashService.deleteCarwashPhoto(carwashId, photoToDelete.url);

          // Update local state
          setBusinessData({
            ...businessData,
            photos: businessData.photos.filter((photo) => photo.id !== id),
          });
        }
      } else {
        // New photo - just remove from local state
        setPhotos(photos.filter((_, index) => index !== id));
        toast.success("Photo removed");
      }
    } catch (error) {
      console.error('❌ Failed to delete photo:', error);
      toast.error("Failed to delete photo");
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your business account? This cannot be undone.")) {
      // Simulate account deletion
      toast.success("Account deletion requested");
      navigate("/logout");
      // TODO: Implement DELETE /api/carwashes/{id}
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F9FAFB]/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile & Settings</h1>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-4 space-y-2">
                {[
                  { id: "business-info", label: "Business Info", icon: User },
                  { id: "hours", label: "Operating Hours", icon: Clock },
                  { id: "payout-methods", label: "Payout Methods", icon: DollarSign },
                  { id: "notifications", label: "Notifications", icon: Bell },
                  { id: "account", label: "Account Actions", icon: AlertTriangle },
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "business-info" && "Business Information"}
                  {activeTab === "hours" && "Operating Hours"}
                  {activeTab === "payout-methods" && "Payout Methods"}
                  {activeTab === "notifications" && "Notification Preferences"}
                  {activeTab === "account" && "Account Actions"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeTab === "business-info" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-semibold">
                        Business Name <span className="text-[#EF4444]">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={businessData.name}
                        onChange={(e) =>
                          setBusinessData({ ...businessData, name: e.target.value })
                        }
                        placeholder="Sparkle Carwash"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={businessData.description}
                        onChange={(e) =>
                          setBusinessData({ ...businessData, description: e.target.value })
                        }
                        placeholder="Describe your carwash services..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="font-semibold">
                        Address <span className="text-[#EF4444]">*</span>
                      </Label>
                      <Input
                        id="address"
                        value={businessData.address}
                        onChange={(e) =>
                          setBusinessData({ ...businessData, address: e.target.value })
                        }
                        placeholder="123 Main Street, Lagos"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-semibold">
                        Phone Number <span className="text-[#EF4444]">*</span>
                      </Label>
                      <Input
                        id="phone"
                        value={businessData.phone}
                        onChange={(e) =>
                          setBusinessData({ ...businessData, phone: e.target.value })
                        }
                        placeholder="+234 801 234 5678"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={businessData.email} disabled />
                      <p className="text-xs text-[#6B7280]">
                        Email linked to your account cannot be changed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Photos</Label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        multiple
                        className="hidden"
                        id="photo-upload"
                        onChange={handlePhotoUpload}
                      />
                      <label
                        htmlFor="photo-upload"
                        className="bg-[#2563EB] text-white px-4 py-2 rounded-md cursor-pointer hover:bg-[#1D4ED8] inline-flex gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Photos
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                        {businessData.photos.map((photo) => (
                          <div key={photo.id} className="relative">
                            <img
                              src={photo.url}
                              alt="Business photo"
                              className="w-full h-32 object-cover rounded-md"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 text-[#EF4444]"
                              onClick={() => handleDeletePhoto(photo.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {photos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`New photo ${index + 1}`}
                              className="w-full h-32 object-cover rounded-md"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 text-[#EF4444]"
                              onClick={() => handleDeletePhoto(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        Upload up to 5 photos (JPG/PNG, max 5MB each)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxCarsPerSlot" className="font-semibold">
                        Max Cars Per Slot <span className="text-[#EF4444]">*</span>
                      </Label>
                      <Input
                        id="maxCarsPerSlot"
                        type="number"
                        min="1"
                        value={businessData.maxCarsPerSlot}
                        onChange={(e) =>
                          setBusinessData({ ...businessData, maxCarsPerSlot: parseInt(e.target.value) || 0 })
                        }
                        placeholder="e.g. 5"
                        required
                      />
                      <p className="text-xs text-[#6B7280]">
                        How many cars can be serviced simultaneously in one time slot.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "hours" && (
                  <div className="space-y-4">
                    <p className="text-sm text-[#6B7280]">
                      Set your carwash’s operating hours for each day
                    </p>
                    {businessData.hours.map((hour, index) => (
                      <div key={hour.day} className="flex items-center gap-4">
                        <div className="w-24">
                          <Label>{hour.day}</Label>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input
                            type="time"
                            value={hour.open}
                            onChange={(e) => {
                              const newHours = [...businessData.hours];
                              newHours[index].open = e.target.value;
                              setBusinessData({ ...businessData, hours: newHours });
                            }}
                            disabled={hour.closed}
                          />
                          <Input
                            type="time"
                            value={hour.close}
                            onChange={(e) => {
                              const newHours = [...businessData.hours];
                              newHours[index].close = e.target.value;
                              setBusinessData({ ...businessData, hours: newHours });
                            }}
                            disabled={hour.closed}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={hour.closed}
                            onCheckedChange={(checked) => {
                              const newHours = [...businessData.hours];
                              newHours[index].closed = checked;
                              setBusinessData({ ...businessData, hours: newHours });
                            }}
                          />
                          <Label>Closed</Label>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const newHours = businessData.hours.map((h) => ({
                          ...h,
                          open: businessData.hours[0].open,
                          close: businessData.hours[0].close,
                          closed: businessData.hours[0].closed,
                        }));
                        setBusinessData({ ...businessData, hours: newHours });
                      }}
                    >
                      Copy Monday’s Hours to All
                    </Button>
                  </div>
                )}

                {activeTab === "payout-methods" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="payout-type">Payout Type</Label>
                      <Select
                        value={businessData.payoutMethod.type}
                        onValueChange={(value) =>
                          setBusinessData({
                            ...businessData,
                            payoutMethod: { ...businessData.payoutMethod, type: value as PayoutMethod["type"] },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payout method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank">Bank Account</SelectItem>
                          <SelectItem value="mobile">Mobile Money</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {businessData.payoutMethod.type === "bank" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="bank-name">Bank Name</Label>
                          <Input
                            id="bank-name"
                            value={businessData.payoutMethod.bankName || ""}
                            onChange={(e) =>
                              setBusinessData({
                                ...businessData,
                                payoutMethod: { ...businessData.payoutMethod, bankName: e.target.value },
                              })
                            }
                            placeholder="e.g., First Bank"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="account-number">Account Number</Label>
                          <Input
                            id="account-number"
                            value={businessData.payoutMethod.accountNumber || ""}
                            onChange={(e) =>
                              setBusinessData({
                                ...businessData,
                                payoutMethod: { ...businessData.payoutMethod, accountNumber: e.target.value },
                              })
                            }
                            placeholder="e.g., 1234567890"
                          />
                        </div>
                      </>
                    )}
                    {businessData.payoutMethod.type === "mobile" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="mobile-provider">Mobile Money Provider</Label>
                          <Input
                            id="mobile-provider"
                            value={businessData.payoutMethod.mobileProvider || ""}
                            onChange={(e) =>
                              setBusinessData({
                                ...businessData,
                                payoutMethod: { ...businessData.payoutMethod, mobileProvider: e.target.value },
                              })
                            }
                            placeholder="e.g., MTN Mobile Money"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mobile-number">Mobile Number</Label>
                          <Input
                            id="mobile-number"
                            value={businessData.payoutMethod.mobileNumber || ""}
                            onChange={(e) =>
                              setBusinessData({
                                ...businessData,
                                payoutMethod: { ...businessData.payoutMethod, mobileNumber: e.target.value },
                              })
                            }
                            placeholder="e.g., +234 801 234 5678"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div className="space-y-4">
                    <p className="text-sm text-[#6B7280]">
                      Choose how you want to receive notifications
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-semibold">Email Notifications</Label>
                        <p className="text-sm text-[#6B7280]">
                          Receive updates via email
                        </p>
                      </div>
                      <Switch
                        checked={businessData.notifications.email}
                        onCheckedChange={(checked) =>
                          setBusinessData({
                            ...businessData,
                            notifications: { ...businessData.notifications, email: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-semibold">SMS Notifications</Label>
                        <p className="text-sm text-[#6B7280]">
                          Receive updates via SMS
                        </p>
                      </div>
                      <Switch
                        checked={businessData.notifications.sms}
                        onCheckedChange={(checked) =>
                          setBusinessData({
                            ...businessData,
                            notifications: { ...businessData.notifications, sms: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-semibold">Push Notifications</Label>
                        <p className="text-sm text-[#6B7280]">
                          Receive updates via app
                        </p>
                      </div>
                      <Switch
                        checked={businessData.notifications.push}
                        onCheckedChange={(checked) =>
                          setBusinessData({
                            ...businessData,
                            notifications: { ...businessData.notifications, push: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {activeTab === "account" && (
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => navigate("/logout")}
                    >
                      <LogOut className="h-5 w-5" />
                      Log Out
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      onClick={handleDeleteAccount}
                    >
                      <AlertTriangle className="h-5 w-5" />
                      Delete Account
                    </Button>
                    <p className="text-xs text-[#6B7280]">
                      Deleting your account is permanent and cannot be undone.
                    </p>
                  </div>
                )}

                {activeTab !== "account" && (
                  <Button
                    className="mt-4"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 mr-2"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                          />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfileSettings;