import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import CarwashService from "@/Contexts/CarwashService";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Clock,
  DollarSign,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { LocationSearchBar } from "@/components/LocationSearchBar";
import { useAuth } from "@/Contexts/AuthContext";

// Mock user data
const mockUser = {
  email: "owner@carwash.com",
};

// Types
interface BusinessInfo {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  lat?: number;
  lng?: number;
  maxCarsPerSlot: number;
  homeService: boolean;
  deliveryRadiusKM: number;
  basePrice: number;
}

interface OperatingHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

interface Service {
  name: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
  addOns: string[];
}

interface PayoutMethod {
  type: "bank" | "mobile" | "";
  bankName?: string;
  accountNumber?: string;
  mobileProvider?: string;
  mobileNumber?: string;
}

const PostOnboarding = () => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: mockUser.email,
    maxCarsPerSlot: 1,
    homeService: false,
    deliveryRadiusKM: 10,
    basePrice: 5000,
  });
  const navigate = useNavigate();
  const { refreshUser } = useAuth(); // Get refreshUser from AuthContext
  const [photos, setPhotos] = useState<File[]>([]);
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([
    { day: "Monday", open: "08:00", close: "20:00", closed: false },
    { day: "Tuesday", open: "08:00", close: "20:00", closed: false },
    { day: "Wednesday", open: "08:00", close: "20:00", closed: false },
    { day: "Thursday", open: "08:00", close: "20:00", closed: false },
    { day: "Friday", open: "08:00", close: "20:00", closed: false },
    { day: "Saturday", open: "08:00", close: "20:00", closed: false },
    { day: "Sunday", open: "08:00", close: "20:00", closed: true },
  ]);
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Service>({
    name: "",
    description: "",
    price: 0,
    duration: "",
    features: [],
    addOns: [],
  });
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>({ type: "" });
  const [featureInput, setFeatureInput] = useState("");
  const [addOnInput, setAddOnInput] = useState("");

  const steps = [
    { id: 1, title: "Business", shortTitle: "Info", icon: User },
    { id: 2, title: "Photos", shortTitle: "Photos", icon: Upload },
    { id: 3, title: "Hours", shortTitle: "Hours", icon: Clock },
    { id: 4, title: "Services", shortTitle: "Service", icon: DollarSign },
    { id: 5, title: "Payout", shortTitle: "Payout", icon: DollarSign },
  ];

  const validateStep = () => {
    if (step === 1) {
      return businessInfo.name && businessInfo.address && businessInfo.phone;
    }
    if (step === 4) {
      return services.length > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) {
      alert("Please fill all required fields");
      return;
    }
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    setIsSaving(true);

    try {
      // Transform operating hours to map
      const openHoursMap: Record<string, { start: string; end: string }> = {};
      operatingHours.forEach(h => {
        if (!h.closed) {
          openHoursMap[h.day] = { start: h.open, end: h.close };
        }
      });

      // Transform services
      const formattedServices = services.map(s => {
        // Parse duration string to integer minutes
        let durationMinutes = 30; // default
        if (s.duration.includes("15")) durationMinutes = 15;
        if (s.duration.includes("30")) durationMinutes = 30;
        if (s.duration.includes("45")) durationMinutes = 45;
        if (s.duration.includes("1 hour")) durationMinutes = 60;

        return {
          name: s.name,
          description: s.description + (s.features.length > 0 ? ` Features: ${s.features.join(", ")}` : ""),
          price: s.price,
          duration: durationMinutes
        };
      });

      const payload = {
        name: businessInfo.name,
        description: businessInfo.description,
        address: businessInfo.address,
        // phone: businessInfo.phone, // Backend model doesn't seem to have phone? Checking... It's not in the struct I saw.
        // Let's put phone in description for now if needed, or just omit if backend doesn't take it.
        // Actually, let's check the struct again. It has Name, Description, Address, Location... No Phone.
        // We'll omit phone for now to avoid errors, or append to description.
        location: {
          type: "Point",
          coordinates: [
            businessInfo.lng || 3.3792,
            businessInfo.lat || 6.5244
          ]
        },
        open_hours: openHoursMap,
        services: formattedServices,
        max_cars_per_slot: businessInfo.maxCarsPerSlot,
        home_service: businessInfo.homeService,
        delivery_radius_km: businessInfo.homeService ? businessInfo.deliveryRadiusKM : 0,
        base_price: businessInfo.basePrice,
        is_active: true,
        has_location: true,
        has_onboarded: true
      };

      // Call the service
      const createdCarwash = await CarwashService.createCarwash(payload);

      // ✅ SUCCESS: Extract carwash ID (now correctly returns the data object from service)
      const carwashId = createdCarwash.id || (createdCarwash as any)._id;

      if (!carwashId) {
        console.warn('⚠️ Carwash created but ID not found in response:', createdCarwash);
      }

      // ✅ UPDATE: Store carwash_id in user object (localStorage)
      const storedUser = localStorage.getItem('user');
      if (storedUser && carwashId) {
        try {
          const userObj = JSON.parse(storedUser);
          userObj.carwash_id = carwashId;
          localStorage.setItem('user', JSON.stringify(userObj));
          console.log('✅ User carwash_id updated in localStorage:', carwashId);

          // Refresh the user in AuthContext so it picks up the new carwash_id
          refreshUser();
        } catch (e) {
          console.error('Failed to update user in localStorage:', e);
        }
      }

      // Upload photos if any
      if (photos.length > 0 && createdCarwash.id) {
        try {
          await CarwashService.uploadCarwashPhotos(createdCarwash.id, photos);
        } catch (photoError) {
          console.error("Failed to upload photos:", photoError);
          toast.error("Business created but failed to upload photos. You can add them later.");
        }
      }

      toast.success("Business setup complete!");
      navigate("/business-dashboard");
    } catch (error) {
      console.error("Onboarding failed:", error);
      // Error is handled in the service with toast
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(
        (file) => file.size <= 5 * 1024 * 1024 && ["image/jpeg", "image/png"].includes(file.type)
      );
      if (validFiles.length + photos.length > 5) {
        alert("Maximum 5 photos allowed");
        return;
      }
      setPhotos([...photos, ...validFiles]);
    }
  };

  const handleAddFeature = () => {
    if (featureInput) {
      setNewService({ ...newService, features: [...newService.features, featureInput] });
      setFeatureInput("");
    }
  };

  const handleAddAddOn = () => {
    if (addOnInput) {
      setNewService({ ...newService, addOns: [...newService.addOns, addOnInput] });
      setAddOnInput("");
    }
  };

  const handleAddService = () => {
    if (newService.name && newService.price && newService.duration) {
      setServices([...services, newService]);
      setNewService({ name: "", description: "", price: 0, duration: "", features: [], addOns: [] });
      alert("Service added");
    } else {
      alert("Please fill all required service fields");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-4 sm:py-8 px-3 sm:px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">
            Set Up Your Carwash Business
          </CardTitle>

          {/* Step Indicators - Mobile Optimized */}
          <div className="flex justify-between items-center mt-4 sm:mt-6 gap-1 sm:gap-2">
            {steps.map((s, index) => (
              <div key={s.id} className="flex-1 relative">
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block absolute top-6 left-1/2 w-full h-0.5 ${s.id < step ? "bg-blue-600" : "bg-gray-300"
                    }`} />
                )}

                <div className={`relative flex flex-col items-center gap-1 ${s.id <= step ? "text-blue-600" : "text-gray-400"
                  }`}>
                  {/* Circle with icon */}
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${s.id <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                    <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>

                  {/* Title - responsive */}
                  <p className="text-[10px] sm:text-xs font-medium text-center hidden sm:block">
                    {s.title}
                  </p>
                  <p className="text-[9px] font-medium text-center sm:hidden">
                    {s.shortTitle}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Progress value={(step / 5) * 100} className="mt-3 sm:mt-4" />
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Business Information</h3>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                  placeholder="Sparkle Carwash"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Textarea
                  id="description"
                  value={businessInfo.description}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                  placeholder="Describe your carwash services..."
                  rows={3}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold">
                  Address <span className="text-red-500">*</span>
                </Label>
                <LocationSearchBar
                  onPlaceSelected={(lat, lng, address) => {
                    setBusinessInfo({
                      ...businessInfo,
                      address,
                      lat,
                      lng
                    });
                  }}
                  placeholder="Search for your business location..."
                  className="text-sm sm:text-base"
                />
                {businessInfo.address && (
                  <p className="text-xs text-gray-600 mt-1">
                    Selected: {businessInfo.address}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  placeholder="+234 801 234 5678"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basePrice" className="text-sm font-semibold">
                  Default Base Price (NGN) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
                  <Input
                    id="basePrice"
                    type="number"
                    value={businessInfo.basePrice}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, basePrice: parseFloat(e.target.value) || 0 })}
                    placeholder="5000"
                    className="pl-7 text-sm sm:text-base"
                  />
                </div>
                <p className="text-xs text-gray-500">The minimum price shown to customers for a basic wash slot.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCarsPerSlot" className="text-sm font-semibold">
                  Service Capacity (Cars per slot) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="maxCarsPerSlot"
                  type="number"
                  min="1"
                  value={businessInfo.maxCarsPerSlot}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, maxCarsPerSlot: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  className="text-sm sm:text-base"
                />
                <p className="text-xs text-gray-500">How many cars can you service concurrently in a 30-minute window?</p>
              </div>

              {/* Home Service Settings */}
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-blue-900">Offer Home Service</Label>
                    <p className="text-xs text-blue-700">We will send workers to client locations</p>
                  </div>
                  <Switch
                    checked={businessInfo.homeService}
                    onCheckedChange={(checked) => setBusinessInfo({ ...businessInfo, homeService: checked })}
                  />
                </div>

                {businessInfo.homeService && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="deliveryRadius" className="text-sm font-semibold">
                      Delivery Radius (KM) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="deliveryRadius"
                      type="number"
                      min="1"
                      max="100"
                      value={businessInfo.deliveryRadiusKM}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, deliveryRadiusKM: parseInt(e.target.value) || 0 })}
                      placeholder="10"
                      className="text-sm sm:text-base"
                    />
                    <p className="text-xs text-gray-500">How far are you willing to travel from your base station?</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  value={businessInfo.email}
                  disabled
                  className="text-sm sm:text-base"
                />
                <p className="text-xs text-gray-600">
                  Email linked to your account cannot be changed
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Photos */}
          {step === 2 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Upload Photos</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Add up to 5 photos of your carwash facility (JPG/PNG, max 5MB each)
              </p>
              <div>
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
                  className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 text-sm sm:text-base"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 sm:h-32 object-cover rounded-md"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-0.5 right-0.5 h-6 w-6 sm:h-8 sm:w-8 bg-white/80 hover:bg-white text-red-600"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Operating Hours */}
          {step === 3 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Operating Hours</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Set your carwash's operating hours for each day
              </p>
              <div className="space-y-2 sm:space-y-3">
                {operatingHours.map((hour, index) => (
                  <div key={hour.day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2 sm:p-0 bg-gray-50 sm:bg-transparent rounded-lg">
                    <div className="w-full sm:w-24">
                      <Label className="text-xs sm:text-sm font-medium">{hour.day}</Label>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        type="time"
                        value={hour.open}
                        onChange={(e) => {
                          const newHours = [...operatingHours];
                          newHours[index].open = e.target.value;
                          setOperatingHours(newHours);
                        }}
                        disabled={hour.closed}
                        className="text-xs sm:text-sm"
                      />
                      <Input
                        type="time"
                        value={hour.close}
                        onChange={(e) => {
                          const newHours = [...operatingHours];
                          newHours[index].close = e.target.value;
                          setOperatingHours(newHours);
                        }}
                        disabled={hour.closed}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={hour.closed}
                        onChange={(e) => {
                          const newHours = [...operatingHours];
                          newHours[index].closed = e.target.checked;
                          setOperatingHours(newHours);
                        }}
                        className="w-4 h-4"
                      />
                      <Label className="text-xs sm:text-sm">Closed</Label>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const newHours = operatingHours.map((h) => ({
                    ...h,
                    open: operatingHours[0].open,
                    close: operatingHours[0].close,
                    closed: operatingHours[0].closed,
                  }));
                  setOperatingHours(newHours);
                }}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Copy Monday to All Days
              </Button>
            </div>
          )}

          {/* Step 4: Add Service */}
          {step === 4 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Add Service</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Add at least one service for your carwash
              </p>
              <div className="space-y-2">
                <Label htmlFor="service-name" className="text-sm font-semibold">
                  Service Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="service-name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="Exterior Wash"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-description" className="text-sm">Description</Label>
                <Textarea
                  id="service-description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Describe the service..."
                  rows={2}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service-price" className="text-sm font-semibold">
                    Price (NGN) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="service-price"
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                    placeholder="6000"
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-duration" className="text-sm font-semibold">
                    Duration <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={newService.duration}
                    onValueChange={(value) => setNewService({ ...newService, duration: value })}
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15 mins">15 minutes</SelectItem>
                      <SelectItem value="30 mins">30 minutes</SelectItem>
                      <SelectItem value="45 mins">45 minutes</SelectItem>
                      <SelectItem value="1 hour">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-features" className="text-sm">Features</Label>
                <div className="flex gap-2">
                  <Input
                    id="service-features"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="Add a feature"
                    className="text-sm sm:text-base"
                  />
                  <Button onClick={handleAddFeature} size="sm" className="text-xs sm:text-sm">Add</Button>
                </div>
                {newService.features.length > 0 && (
                  <ul className="space-y-1">
                    {newService.features.map((feature, index) => (
                      <li key={index} className="flex items-center justify-between text-xs sm:text-sm bg-gray-50 p-2 rounded">
                        <span>{feature}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-600"
                          onClick={() =>
                            setNewService({
                              ...newService,
                              features: newService.features.filter((_, i) => i !== index),
                            })
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-addons" className="text-sm">Add-ons (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="service-addons"
                    value={addOnInput}
                    onChange={(e) => setAddOnInput(e.target.value)}
                    placeholder="Add an add-on"
                    className="text-sm sm:text-base"
                  />
                  <Button onClick={handleAddAddOn} size="sm" className="text-xs sm:text-sm">Add</Button>
                </div>
                {newService.addOns.length > 0 && (
                  <ul className="space-y-1">
                    {newService.addOns.map((addOn, index) => (
                      <li key={index} className="flex items-center justify-between text-xs sm:text-sm bg-gray-50 p-2 rounded">
                        <span>{addOn}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-600"
                          onClick={() =>
                            setNewService({
                              ...newService,
                              addOns: newService.addOns.filter((_, i) => i !== index),
                            })
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button onClick={handleAddService} className="w-full text-sm sm:text-base">Add Service</Button>
              {services.length > 0 && (
                <div className="mt-3 sm:mt-4">
                  <h4 className="text-sm font-semibold mb-2">Added Services ({services.length})</h4>
                  <ul className="space-y-2">
                    {services.map((service, index) => (
                      <li key={index} className="flex items-start justify-between text-xs sm:text-sm bg-blue-50 p-2 sm:p-3 rounded">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-gray-600">₦{service.price} • {service.duration}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-8 sm:w-8 text-red-600"
                          onClick={() => setServices(services.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Payout Method */}
          {step === 5 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Payout Method</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Add payment details for receiving payments (optional)
              </p>
              <div className="space-y-2">
                <Label htmlFor="payout-type" className="text-sm">Payout Type</Label>
                <Select
                  value={payoutMethod.type}
                  onValueChange={(value) =>
                    setPayoutMethod({ ...payoutMethod, type: value as "bank" | "mobile" | "" })
                  }
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Account</SelectItem>
                    <SelectItem value="mobile">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {payoutMethod.type === "bank" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bank-name" className="text-sm">Bank Name</Label>
                    <Input
                      id="bank-name"
                      value={payoutMethod.bankName || ""}
                      onChange={(e) => setPayoutMethod({ ...payoutMethod, bankName: e.target.value })}
                      placeholder="e.g., First Bank"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-number" className="text-sm">Account Number</Label>
                    <Input
                      id="account-number"
                      value={payoutMethod.accountNumber || ""}
                      onChange={(e) => setPayoutMethod({ ...payoutMethod, accountNumber: e.target.value })}
                      placeholder="e.g., 1234567890"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </>
              )}
              {payoutMethod.type === "mobile" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="mobile-provider" className="text-sm">Mobile Money Provider</Label>
                    <Input
                      id="mobile-provider"
                      value={payoutMethod.mobileProvider || ""}
                      onChange={(e) => setPayoutMethod({ ...payoutMethod, mobileProvider: e.target.value })}
                      placeholder="e.g., MTN Mobile Money"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile-number" className="text-sm">Mobile Number</Label>
                    <Input
                      id="mobile-number"
                      value={payoutMethod.mobileNumber || ""}
                      onChange={(e) => setPayoutMethod({ ...payoutMethod, mobileNumber: e.target.value })}
                      placeholder="e.g., +234 801 234 5678"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2 sm:pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || isSaving}
              className="gap-2 order-2 sm:order-1 text-sm sm:text-base"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={isSaving}
              className="gap-2 order-1 sm:order-2 text-sm sm:text-base"
            >
              {step === 5 ? (
                isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Complete Setup"
                )
              ) : (
                <>
                  Next <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          {step === 5 && (
            <Button
              variant="outline"
              onClick={() => handleComplete()}
              disabled={isSaving}
              className="w-full text-sm sm:text-base"
            >
              Skip Payout Method
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PostOnboarding;