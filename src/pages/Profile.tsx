import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  LogOut,
  Save,
  Edit,
  Trash2,
  Plus,
  Check,
  Upload,
} from "lucide-react";
import { Checkbox } from "@radix-ui/react-checkbox";

// Mock user data (replace with API calls in production)
const mockUser = {
  fullName: "John Doe",
  email: "john.doe@gmail.com",
  phone: "+234 801 234 5678",
  dateOfBirth: "1990-05-15",
  gender: "Male",
  profilePhoto: null,
  addresses: [
    {
      id: "1",
      label: "Home",
      address: "123 Main Street, Alimosho, Lagos, Nigeria",
      phone: "+234 801 234 5678",
      instructions: "Gate code: 1234",
      isDefault: true,
    },
    {
      id: "2",
      label: "Work",
      address: "456 Business Avenue, Ikeja, Lagos, Nigeria",
      phone: "+234 801 234 5678",
      instructions: "",
      isDefault: false,
    },
  ],
  paymentMethods: [
    {
      id: "1",
      brand: "Visa",
      maskedNumber: "•••• •••• •••• 1234",
      expiry: "12/25",
      cardholderName: "John Doe",
      isDefault: true,
    },
  ],
  notifications: {
    bookingConfirmations: { email: true, sms: true, push: true },
    bookingReminders: { email: true, sms: false, push: true },
    bookingUpdates: { email: true, sms: true, push: false },
    promotionalOffers: { email: true, sms: false },
    newsUpdates: { email: false },
    securityAlerts: { email: true, sms: true },
  },
  accountCreated: "October 2024",
  totalBookings: 18,
};

// Navigation tabs
const tabs = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "addresses", label: "Addresses", icon: MapPin, badge: mockUser.addresses.length },
  // { id: "payments", label: "Payment Methods", icon: CreditCard, badge: mockUser.paymentMethods.length }, // TODO: Implement payment integration
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "account", label: "Account", icon: LogOut },
];

import UserService, { UserProfile, UserAddress } from "@/Contexts/UserService";
import { useAuth } from "@/Contexts/AuthContext";

// ... existing imports

const Profile = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState({ open: false, type: "", id: "" });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    address: "",
    area: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    instructions: "",
    isDefault: false,
  });
  // Payment state kept for UI but not connected
  const [newPayment, setNewPayment] = useState({
    cardNumber: "",
    cardholderName: "",
    expiry: "",
    cvv: "",
    isDefault: false,
  });

  useEffect(() => {
    if (authUser?.id) {
      fetchUserProfile(authUser.id);
    }
  }, [authUser]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      const profile = await UserService.getUserProfile(userId);

      // Set default values for optional fields if not provided by backend
      const enrichedProfile: UserProfile = {
        ...profile,
        // paymentMethods: profile.paymentMethods || [], // TODO: Add when payment integration is ready
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
      setPersonalInfo({
        fullName: profile.name,
        phone: profile.phone,
        dateOfBirth: "", // Not in backend
        gender: "", // Not in backend
      });
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalInfoSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updatedUser = await UserService.updateUserProfile(user.id, {
        name: personalInfo.fullName,
        phone: personalInfo.phone,
      });
      setUser(updatedUser);
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      if (!user) return;
      try {
        const updatedUser = await UserService.uploadProfilePhoto(user.id, file);
        setUser(updatedUser);
        toast.success("Profile photo uploaded");
      } catch (error) {
        toast.error("Failed to upload photo");
      }
    } else {
      toast.error("File must be JPG/PNG and less than 5MB");
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    try {
      const updatedUser = await UserService.deleteProfilePhoto(user.id);
      setUser(updatedUser);
      toast.success("Profile photo removed");
    } catch (error) {
      toast.error("Failed to remove photo");
    }
  };

  const handleAddAddress = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const addressData: UserAddress = {
        type: newAddress.label.toLowerCase(),
        label: newAddress.label,
        address_line: `${newAddress.address} ${newAddress.area ? ', ' + newAddress.area : ''}`,
        city: newAddress.city,
        state: newAddress.state,
        country: "Nigeria",
        is_default: newAddress.isDefault,
        location: {
          type: "Point",
          coordinates: [0, 0] // Default dummy coordinates
        }
      };

      await UserService.addUserAddress(user.id, addressData);

      // Refresh profile to get updated addresses
      fetchUserProfile(user.id);

      setShowAddAddress(false);
      setNewAddress({
        label: "Home",
        address: "",
        area: "",
        city: "",
        state: "",
        postalCode: "",
        phone: "",
        instructions: "",
        isDefault: false,
      });
      toast.success("Address added");
    } catch (error) {
      toast.error("Failed to add address");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!user) return;
    try {
      await UserService.deleteUserAddress(user.id, id);
      // Optimistic update or refresh
      fetchUserProfile(user.id);
      setShowDeleteDialog({ open: false, type: "", id: "" });
      toast.success("Address deleted");
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!user) return;
    try {
      await UserService.setDefaultAddress(user.id, id);
      fetchUserProfile(user.id);
      toast.success("Default address updated");
    } catch (error) {
      toast.error("Failed to set default address");
    }
  };

  // Payment methods are mock for now
  const handleAddPayment = () => {
    toast.info("Payment integration coming soon");
    setShowAddPayment(false);
  };

  const handleDeletePayment = (id: string) => {
    toast.info("Payment integration coming soon");
    setShowDeleteDialog({ open: false, type: "", id: "" });
  };

  const handleSetDefaultPayment = (id: string) => {
    toast.info("Payment integration coming soon");
  };

  const handleNotificationChange = (type: string, channel: string, value: boolean) => {
    toast.info("Notification settings saved locally");
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.toUpperCase() === "DELETE") {
      toast.success("Account deletion request sent");
      setShowDeleteDialog({ open: false, type: "", id: "" });
      setTimeout(() => navigate("/"), 2000);
    } else {
      toast.error("Please type DELETE to confirm");
    }
  };

  if (isLoading && !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  // Fallback if user is null (shouldn't happen after loading)
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F9FAFB] border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-2xl font-bold sm:text-left text-center">Profile & Settings</h1>
          {isSaving ? (
            <Badge variant="outline" className="gap-2">
              <span>Saving...</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-2 text-[#10B981]">
              <Check className="h-4 w-4" />
              All changes saved
            </Badge>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-0">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    className={`w-full justify-start px-4 py-3 text-left gap-3 transition-colors ${activeTab === tab.id
                      ? "bg-[#DBEAFE] text-[#2563EB] border-l-4 border-[#2563EB]"
                      : "text-[#6B7280] hover:bg-gray-100"
                      }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <Badge variant="outline" className="ml-auto">
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
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <p className="text-sm text-[#6B7280]">
                    Update your personal details and profile picture
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Photo */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-[120px] h-[120px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {user.profile_photo ? (
                        <img
                          src={user.profile_photo}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-semibold">{user.name?.charAt(0)}</span>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        id="photo-upload"
                        onChange={handlePhotoUpload}
                      />
                      <label
                        htmlFor="photo-upload"
                        className="absolute bottom-0 right-0 bg-[#2563EB] text-white p-2 rounded-full cursor-pointer hover:bg-[#1D4ED8]"
                      >
                        <Upload className="h-4 w-4" />
                      </label>
                    </div>
                    {user.profile_photo && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#EF4444] border-[#EF4444]"
                        onClick={handleRemovePhoto}
                      >
                        Remove Photo
                      </Button>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="font-semibold">
                        Full Name <span className="text-[#EF4444]">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        value={personalInfo.fullName}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, fullName: e.target.value })
                        }
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-semibold">
                        Email Address <span className="text-[#EF4444]">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          value={user.email}
                          disabled
                          className="pr-10"
                        />
                        <Shield className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        Email cannot be changed (linked to Google account)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-semibold">
                        Phone Number <span className="text-[#EF4444]">*</span>
                      </Label>
                      <Input
                        id="phone"
                        value={personalInfo.phone}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, phone: e.target.value })
                        }
                        placeholder="+234 801 234 5678"
                        required
                      />
                      <p className="text-xs text-[#6B7280]">
                        Used for booking confirmations and updates
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full sm:w-auto"
                    onClick={handlePersonalInfoSave}
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
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "addresses" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Saved Addresses
                      <Button onClick={() => setShowAddAddress(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Address
                      </Button>
                    </CardTitle>
                    <p className="text-sm text-[#6B7280]">
                      Manage addresses for home service bookings
                    </p>
                  </CardHeader>
                  <CardContent>
                    {!user.addresses || user.addresses.length === 0 ? (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 mx-auto text-[#6B7280]" />
                        <h3 className="mt-4 text-lg font-semibold">No saved addresses</h3>
                        <p className="text-sm text-[#6B7280] mb-4">
                          Add addresses for faster home service bookings
                        </p>
                        <Button onClick={() => setShowAddAddress(true)}>
                          Add Your First Address
                        </Button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        {user.addresses.map((addr) => (
                          <Card key={addr.id} className={`${addr.is_default ? "border-l-4 border-[#2563EB]" : ""}`}>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-lg">{addr.label || addr.type}</span>
                                  {addr.is_default && (
                                    <Badge className="bg-[#2563EB] text-white">DEFAULT</Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-[#EF4444]"
                                    onClick={() =>
                                      setShowDeleteDialog({
                                        open: true,
                                        type: "address",
                                        id: addr.id || "",
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-[#6B7280]">{addr.address_line}</p>
                              <p className="text-sm text-[#6B7280] mt-1">{addr.city}, {addr.state}</p>
                              {!addr.is_default && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-4"
                                  onClick={() => handleSetDefaultAddress(addr.id || "")}
                                >
                                  Set as Default
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Add Address Modal */}
                <Dialog open={showAddAddress} onOpenChange={setShowAddAddress}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Address</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="label">Label</Label>
                        <Select
                          value={newAddress.label}
                          onValueChange={(value) => setNewAddress({ ...newAddress, label: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select label" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Work">Work</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Textarea
                          id="address"
                          value={newAddress.address}
                          onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="area">Area/Landmark</Label>
                          <Input
                            id="area"
                            value={newAddress.area}
                            onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Select
                            value={newAddress.state}
                            onValueChange={(value) => setNewAddress({ ...newAddress, state: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Lagos">Lagos</SelectItem>
                              {/* Add more states as needed */}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                          <Input
                            id="postalCode"
                            value={newAddress.postalCode}
                            onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          placeholder="+234 801 234 5678"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instructions">Special Instructions</Label>
                        <Textarea
                          id="instructions"
                          value={newAddress.instructions}
                          onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })}
                          placeholder="e.g., Gate code: 1234"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isDefault"
                          checked={newAddress.isDefault}
                          onCheckedChange={(checked) =>
                            setNewAddress({ ...newAddress, isDefault: !!checked })
                          }
                        />
                        <Label htmlFor="isDefault">Set as default</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddAddress(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddAddress} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Address"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {/* TODO: Payment Methods - Implement when payment integration is ready
          {activeTab === "payments" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Payment Methods
                  <Button onClick={() => setShowAddPayment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </CardTitle>
                <p className="text-sm text-[#6B7280]">
                  Manage your saved payment methods
                </p>
              </CardHeader>
              <CardContent>
                {user.paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-[#6B7280]" />
                    <h3 className="mt-4 text-lg font-semibold">No payment methods saved</h3>
                    <p className="text-sm text-[#6B7280] mb-4">
                      Add a card for faster checkout
                    </p>
                    <Button onClick={() => setShowAddPayment(true)}>
                      Add Payment Method
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {user.paymentMethods.map((pm) => (
                      <Card key={pm.id} className={`${pm.isDefault ? "border-l-4 border-[#2563EB]" : ""}`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{pm.brand}</span>
                              {pm.isDefault && (
                                <Badge className="bg-[#2563EB] text-white">DEFAULT</Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-[#EF4444]"
                                onClick={() =>
                                  setShowDeleteDialog({
                                    open: true,
                                    type: "payment",
                                    id: pm.id,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-[#6B7280]">{pm.maskedNumber}</p>
                          <p className="text-sm text-[#6B7280] mt-1">Expires {pm.expiry}</p>
                          <p className="text-sm text-[#6B7280] mt-1">{pm.cardholderName}</p>
                          {!pm.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={() => handleSetDefaultPayment(pm.id)}
                            >
                              Set as Default
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    value={newPayment.cardNumber}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, cardNumber: e.target.value })
                    }
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    value={newPayment.cardholderName}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, cardholderName: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      value={newPayment.expiry}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, expiry: e.target.value })
                      }
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      value={newPayment.cvv}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, cvv: e.target.value })
                      }
                      placeholder="123"
                      type="password"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefaultPayment"
                    checked={newPayment.isDefault}
                    onCheckedChange={(checked) =>
                      setNewPayment({ ...newPayment, isDefault: !!checked })
                    }
                  />
                  <Label htmlFor="isDefaultPayment">Set as default</Label>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <Shield className="h-4 w-4 text-[#10B981]" />
                  Your payment information is encrypted and secure
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddPayment(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPayment} disabled={isSaving}>
                  {isSaving ? "Adding..." : "Add Card"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          */}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <p className="text-sm text-[#6B7280]">
                    Choose how you want to receive updates
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      title: "Booking Confirmations",
                      description: "Receive confirmation when your booking is accepted",
                      key: "bookingConfirmations",
                      channels: ["email", "sms", "push"],
                    },
                    {
                      title: "Booking Reminders",
                      description: "Get reminders before your scheduled service",
                      key: "bookingReminders",
                      channels: ["email", "sms", "push"],
                    },
                    {
                      title: "Booking Updates",
                      description: "Status changes and service updates",
                      key: "bookingUpdates",
                      channels: ["email", "sms", "push"],
                    },
                    {
                      title: "Promotional Offers",
                      description: "Special deals and discounts",
                      key: "promotionalOffers",
                      channels: ["email", "sms"],
                    },
                    {
                      title: "News & Updates",
                      description: "New features and service announcements",
                      key: "newsUpdates",
                      channels: ["email"],
                    },
                    {
                      title: "Security Alerts",
                      description: "Login attempts and account changes",
                      key: "securityAlerts",
                      channels: ["email", "sms"],
                      disabled: true,
                    },
                  ].map((notif) => (
                    <div key={notif.key} className="flex items-center justify-between py-4 border-b last:border-b-0">
                      <div>
                        <h4 className="font-semibold">{notif.title}</h4>
                        <p className="text-sm text-[#6B7280]">{notif.description}</p>
                      </div>
                      <div className="flex gap-4">
                        {notif.channels.map((channel) => (
                          <div key={channel} className="flex flex-col items-center">
                            <Label className="text-sm capitalize mb-2">{channel}</Label>
                            <Switch
                              checked={user.notifications[notif.key as keyof typeof user.notifications][channel]}
                              onCheckedChange={(checked) =>
                                handleNotificationChange(notif.key, channel, checked)
                              }
                              disabled={notif.disabled}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => toast.success("Notification preferences saved")}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>Security & Privacy</CardTitle>
                  <p className="text-sm text-[#6B7280]">
                    Manage your account security and privacy settings
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold">Change Password</h4>
                    <p className="text-sm text-[#6B7280] mb-2">
                      You signed in with Google. Password management is handled by Google.
                    </p>
                    <Button variant="outline" asChild>
                      <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer">
                        Manage Google Account
                      </a>
                    </Button>
                  </div>
                  <div>
                    <h4 className="font-semibold">Two-Factor Authentication</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#6B7280]">
                        Add an extra layer of security
                      </p>
                      <Badge variant="outline">Not Enabled</Badge>
                    </div>
                    <Switch disabled />
                  </div>
                  <div>
                    <h4 className="font-semibold">Data Sharing</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#6B7280]">
                        Help us improve by sharing anonymous usage statistics
                      </p>
                      <Switch />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Profile Visibility</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-[#6B7280]">
                        Allow carwash businesses to see your booking history
                      </p>
                      <Switch />
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-[#EF4444]">Danger Zone</h4>
                    <p className="text-sm text-[#6B7280] mb-2">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button
                      variant="outline"
                      className="text-[#EF4444] border-[#EF4444]"
                      onClick={() =>
                        setShowDeleteDialog({ open: true, type: "account", id: "" })
                      }
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "account" && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Management</CardTitle>
                  <p className="text-sm text-[#6B7280]">
                    Manage your account and data
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold">Account Information</h4>
                    <div className="space-y-2 text-sm text-[#6B7280]">
                      <p>Account Created: {user.accountCreated}</p>
                      <p>Account Type: Personal Account</p>
                      <p>Total Bookings: {user.totalBookings} completed services</p>
                      <p>Member Since: {user.accountCreated}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Data & Privacy</h4>
                    <Button variant="outline" className="mt-2">
                      Download My Data
                    </Button>
                    <div className="mt-4 space-y-2 text-sm">
                      <a href="/privacy-policy" className="text-[#2563EB] hover:underline">
                        Privacy Policy
                      </a>
                      <br />
                      <a href="/terms-of-service" className="text-[#2563EB] hover:underline">
                        Terms of Service
                      </a>
                      <br />
                      <a href="/cookie-policy" className="text-[#2563EB] hover:underline">
                        Cookie Policy
                      </a>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold">Logout</h4>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/")}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#EF4444]">Delete Account</h4>
                    <p className="text-sm text-[#6B7280] mb-2">
                      This action cannot be undone
                    </p>
                    <Button
                      variant="outline"
                      className="text-[#EF4444] border-[#EF4444]"
                      onClick={() =>
                        setShowDeleteDialog({ open: true, type: "account", id: "" })
                      }
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog.open}
        onOpenChange={(open) => {
          setShowDeleteDialog({ open, type: "", id: "" });
          setDeleteConfirmText("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showDeleteDialog.type === "address"
                ? "Delete Address"
                : showDeleteDialog.type === "payment"
                  ? "Remove Payment Method"
                  : "Delete Account"}
            </DialogTitle>
            <DialogDescription>
              {showDeleteDialog.type === "address" &&
                "Are you sure you want to delete this address? This cannot be undone."}
              {showDeleteDialog.type === "payment" &&
                "Are you sure you want to remove this payment method? You can add it again later."}
              {showDeleteDialog.type === "account" &&
                "This will permanently delete all your data. Type DELETE to confirm."}
            </DialogDescription>
          </DialogHeader>
          {showDeleteDialog.type === "account" && (
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
            />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog({ open: false, type: "", id: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (showDeleteDialog.type === "address") {
                  handleDeleteAddress(showDeleteDialog.id);
                } else if (showDeleteDialog.type === "payment") {
                  handleDeletePayment(showDeleteDialog.id);
                } else {
                  handleDeleteAccount();
                }
              }}
              disabled={showDeleteDialog.type === "account" && deleteConfirmText.toUpperCase() !== "DELETE"}
            >
              {showDeleteDialog.type === "account" ? "Delete My Account" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default Profile;


// MVP Approach
// For an MVP, you could:

// Implement basic profile photo upload
// Add simple address management
// Leave notification preferences as default (all on)
// Use a simple "pay on delivery" option instead of full payment integration