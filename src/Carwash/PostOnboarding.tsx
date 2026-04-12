import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Sparkles,
  Check,
  Plus,
  Home,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  pricing_matrix: {
    small: number;
    medium: number;
    large: number;
  };
  about: string;
  features: string[];
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
    pricing_matrix: {
      small: 5000,
      medium: 5000,
      large: 5000,
    },
    about: "",
    features: [],
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
        location: {
          type: "Point",
          coordinates: [
            Number(businessInfo.lng) || 3.3792,
            Number(businessInfo.lat) || 6.5244
          ]
        },
        open_hours: openHoursMap,
        services: formattedServices,
        max_cars_per_slot: Number(businessInfo.maxCarsPerSlot) || 1,
        home_service: !!businessInfo.homeService,
        delivery_radius_km: businessInfo.homeService ? (Number(businessInfo.deliveryRadiusKM) || 0) : 0,
        pricing_matrix: {
          small: Number(businessInfo.pricing_matrix.small) || 3000,
          medium: Number(businessInfo.pricing_matrix.medium) || 5000,
          large: Number(businessInfo.pricing_matrix.large) || 7000,
        },
        about: businessInfo.about,
        features: businessInfo.features,
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
                <Label htmlFor="description" className="text-sm font-semibold">Short Tagline</Label>
                <Input
                  id="description"
                  value={businessInfo.description}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                  placeholder="e.g. The best wash in Lagos"
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="about" className="text-sm font-semibold">About Our Business</Label>
                <Textarea
                  id="about"
                  value={businessInfo.about}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, about: e.target.value })}
                  placeholder="Provide a detailed description of your business, experience, and what makes you special..."
                  rows={4}
                  className="text-sm sm:text-base"
                />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Home className="h-3 w-3 text-blue-500" /> Facility Amenities
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {["WiFi", "Waiting Room", "Cafe", "Restrooms", "Air Conditioned", "TV"].map((feat) => {
                      const isSelected = businessInfo.features.includes(feat);
                      return (
                        <Badge
                          key={feat}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer py-1 px-3 rounded-full text-[10px] font-bold transition-all"
                          onClick={() => {
                            const newFeats = isSelected 
                              ? businessInfo.features.filter(f => f !== feat)
                              : [...businessInfo.features, feat];
                            setBusinessInfo({ ...businessInfo, features: newFeats });
                          }}
                        >
                          {isSelected && <Check className="h-2 w-2 mr-1" />} {feat}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-yellow-500" /> Services You Offer
                  </Label>
                  <p className="text-[10px] text-muted-foreground mb-2">Check the services you provide. You'll set prices in Step 4.</p>
                  <div className="flex flex-wrap gap-2">
                    {["Detailing", "Engine Wash", "Polishing", "Waxing", "Headlight Restoration", "Ceramic Coating"].map((sName) => {
                      const isSelected = services.some(s => s.name === sName);
                      return (
                        <Badge
                          key={sName}
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer py-1 px-3 rounded-full text-[10px] font-bold transition-all border-dashed",
                            isSelected ? "bg-green-600 hover:bg-green-700 border-green-600" : "hover:border-green-500 hover:text-green-600"
                          )}
                          onClick={() => {
                            if (isSelected) {
                              setServices(services.filter(s => s.name !== sName));
                            } else {
                              setServices([...services, {
                                name: sName,
                                description: `Professional ${sName.toLowerCase()} service`,
                                price: 0,
                                duration: "30 mins",
                                features: [],
                                addOns: []
                              }]);
                              toast.info(`${sName} added to your menu!`);
                            }
                          }}
                        >
                          {isSelected ? <Check className="h-2 w-2 mr-1" /> : <Plus className="h-2 w-2 mr-1" />} {sName}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
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
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-dashed">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" /> Multi-Tier Pricing Matrix
                  </Label>
                  <p className="text-xs text-muted-foreground">Adjust base prices based on vehicle size classifications.</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="price-small" className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Small Cars</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₦</span>
                      <Input
                        id="price-small"
                        type="number"
                        value={businessInfo.pricing_matrix.small}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setBusinessInfo({ 
                            ...businessInfo, 
                            pricing_matrix: { ...businessInfo.pricing_matrix, small: val }
                          });
                        }}
                        className="pl-5 h-9 text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="price-medium" className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Medium / SUV</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₦</span>
                      <Input
                        id="price-medium"
                        type="number"
                        value={businessInfo.pricing_matrix.medium}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setBusinessInfo({ 
                            ...businessInfo, 
                            basePrice: val,
                            pricing_matrix: { ...businessInfo.pricing_matrix, medium: val }
                          });
                        }}
                        className="pl-5 h-9 text-sm font-bold border-primary/50 bg-primary/5"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="price-large" className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Large / Trucks</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₦</span>
                      <Input
                        id="price-large"
                        type="number"
                        value={businessInfo.pricing_matrix.large}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setBusinessInfo({ 
                            ...businessInfo, 
                            pricing_matrix: { ...businessInfo.pricing_matrix, large: val }
                          });
                        }}
                        className="pl-5 h-9 text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  * Medium price is used as the default fallback base price.
                </p>
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

          {/* Step 4: Setup Services */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-blue-600" /> Setup Your Services
                  </h3>
                  <p className="text-sm text-gray-500">
                    Define the core packages your customers can select.
                  </p>
                </div>
                <Badge variant="secondary" className="px-3 py-1 font-bold bg-blue-50 text-blue-700 border-blue-100">
                  {services.length} Added
                </Badge>
              </div>

              {/* Quick Add Templates */}
              <div className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <Label className="text-[10px] font-black uppercase tracking-widest text-blue-700 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" /> Quick Add Templates
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "Express Exterior", price: 3000, duration: "15 mins", description: "Fast exterior wash and dry" },
                    { name: "Executive Detail", price: 15000, duration: "1 hour", description: "Full interior/exterior detailing" },
                    { name: "Interior Only", price: 5000, duration: "30 mins", description: "Deep interior vacuum and wipe" },
                    { name: "Engine Bay Clean", price: 7500, duration: "30 mins", description: "Degreasing and shine" },
                  ].map((temp) => (
                    <Button
                      key={temp.name}
                      variant="outline"
                      size="sm"
                      className="rounded-full border-blue-200 bg-white hover:bg-blue-600 hover:text-white transition-all h-8 text-[11px] font-bold shadow-sm"
                      onClick={() => {
                        setServices([...services, { ...temp, features: [], addOns: [] }]);
                        toast.success(`Added ${temp.name}`);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> {temp.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-dashed" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-muted-foreground font-bold tracking-tighter">Or Create Custom</span>
                </div>
              </div>

              {/* Custom Add Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gray-50 rounded-2xl border">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="service-name" className="text-xs font-black text-gray-500 uppercase">Service Name</Label>
                    <Input
                      id="service-name"
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      placeholder="e.g. Diamond Polish"
                      className="bg-white border-gray-200 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="service-description" className="text-xs font-black text-gray-500 uppercase">Description</Label>
                    <Textarea
                      id="service-description"
                      value={newService.description}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                      placeholder="What's included in this package?"
                      className="bg-white border-gray-200 shadow-sm min-h-[85px] text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="service-price" className="text-xs font-black text-gray-500 uppercase">Price (₦)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₦</span>
                        <Input
                          id="service-price"
                          type="number"
                          value={newService.price}
                          onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                          className="bg-white border-gray-200 shadow-sm font-black pl-7"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="service-duration" className="text-xs font-black text-gray-500 uppercase">Duration</Label>
                      <Select
                        value={newService.duration}
                        onValueChange={(value) => setNewService({ ...newService, duration: value })}
                      >
                        <SelectTrigger className="bg-white border-gray-200 shadow-sm font-bold">
                          <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15 mins">15m</SelectItem>
                          <SelectItem value="30 mins">30m</SelectItem>
                          <SelectItem value="45 mins">45m</SelectItem>
                          <SelectItem value="1 hour">1h</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                       <Input
                        placeholder="Add feature (e.g. Clay Bar)"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        className="h-9 text-xs bg-white"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                      />
                      <Button variant="secondary" size="sm" onClick={handleAddFeature}>+</Button>
                    </div>
                    {newService.features.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {newService.features.map((f, i) => (
                          <Badge key={i} variant="outline" className="bg-white text-[9px] font-bold py-0 h-5">
                            {f} <span className="ml-1 cursor-pointer text-red-500" onClick={() => setNewService({...newService, features: newService.features.filter((_, idx)=>idx!==i)})}>×</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleAddService} 
                    className="w-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 h-11 font-black text-xs uppercase tracking-widest mt-auto transition-all active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add to Menu
                  </Button>
                </div>
              </div>

              {/* Added Services List (Visual Cards) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-100" />
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Your Active Menu ({services.length})
                  </Label>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
                
                {services.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <LayoutGrid className="h-8 w-8 text-gray-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-400 font-bold">Your menu is empty</p>
                      <p className="text-xs text-gray-400">Use templates to get started quickly!</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((service, index) => {
                      const needsPrice = service.price === 0;
                      return (
                        <div 
                          key={index} 
                          className={cn(
                            "group relative bg-white p-4 rounded-3xl border-2 transition-all shadow-sm hover:shadow-md",
                            needsPrice ? "border-amber-200 bg-amber-50/10" : "hover:border-blue-600/50"
                          )}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-lg border hover:bg-red-50 rounded-full"
                            onClick={() => {
                              setServices(services.filter((_, i) => i !== index));
                              toast.info(`Removed ${service.name}`);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="space-y-1.5 pr-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm leading-tight text-gray-900">{service.name}</h4>
                              {needsPrice && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[8px] px-1.5 h-4 font-black uppercase">Price Required</Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{service.description}</p>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">Price</span>
                              {needsPrice ? (
                                <button 
                                  className="text-amber-600 text-[10px] font-black underline decoration-amber-300 underline-offset-2"
                                  onClick={() => {
                                    setNewService(service);
                                    setServices(services.filter((_, i) => i !== index));
                                    document.getElementById("service-price")?.focus();
                                  }}
                                >
                                  Click to Set Price
                                </button>
                              ) : (
                                <span className="font-black text-blue-600 text-base">₦{service.price.toLocaleString()}</span>
                              )}
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Time</span>
                              <Badge variant="outline" className="text-[10px] font-black bg-gray-100 border-gray-200 flex items-center gap-1 h-6">
                                <Clock className="h-3 w-3 text-blue-500" /> {service.duration}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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