import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Car,
  ChevronRight,
  ChevronLeft,
  Plus,
  Loader2,
  Building2,
  Home,
  Wallet,
  CreditCard,
  MapPin,
  Info,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  MapIcon,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import BookingService from "@/Contexts/BookingService";
import CarService, { CarResponse } from "@/Contexts/CarService";
import CarwashService, { Carwash } from "@/Contexts/CarwashService";
import UserService, { UserProfile } from "@/Contexts/UserService";
import { useAuth } from "@/Contexts/AuthContext";
import { LocationSearchBar } from "@/components/LocationSearchBar";
import { cn } from "@/lib/utils";
import { classifyVehicle, VehicleSize } from "@/lib/vehicleClassifier";
import API_BASE_URL from "@/Contexts/baseUrl";

interface BookingInitialState {
  carwashId: string;
  serviceType?: "onsite" | "home";
  selectedService?: any;
  selectedServices?: any[];
  date?: string;
  timeSlot?: string;
}

interface Addon {
  id: string;
  name: string;
  price: number;
}

const availableAddons: Addon[] = [
  { id: "tire-shine", name: "Tire Shine", price: 2000 },
  { id: "engine-bay", name: "Engine Bay Cleaning", price: 7500 },
  { id: "wax", name: "Wax Protection", price: 5000 },
  { id: "air-freshener", name: "Air Freshener", price: 1500 },
];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 20 : -20,
    opacity: 0,
  }),
  center: {
    z: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    z: 0,
    x: direction < 0 ? 20 : -20,
    opacity: 0,
  }),
};

const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialState = location.state as BookingInitialState;

  const [direction, setDirection] = useState(0);
  const [step, setStep] = useState(() => {
    if (initialState?.serviceType === "onsite" && initialState?.date && initialState?.timeSlot) {
      return 3;
    }
    return 1;
  });

  const [carwash, setCarwash] = useState<Carwash | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Address Profile Data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [addressMode, setAddressMode] = useState<"saved" | "new">("saved");

  // Step 1: Mode & Location
  const [serviceType, setServiceType] = useState<"onsite" | "home">(initialState?.serviceType || "onsite");
  const [clientAddress, setClientAddress] = useState("");
  const [userCoordinates, setUserCoordinates] = useState<[number, number] | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);

  // Step 2: Scheduling
  const [date, setDate] = useState(initialState?.date || "");
  const [timeSlot, setTimeSlot] = useState(initialState?.timeSlot || "");
  const [selectedSlotRaw, setSelectedSlotRaw] = useState<string>("");

  // Step 3: Vehicle & Services
  const [myCars, setMyCars] = useState<CarResponse[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string>("new");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [detectedSize, setDetectedSize] = useState<VehicleSize>("medium");

  const [selectedServices, setSelectedServices] = useState<any[]>(() => {
    // Merge singular 'selectedService' and plural 'selectedServices' from initialState
    const plural = initialState?.selectedServices || [];
    const singular = initialState?.selectedService ? [initialState.selectedService] : [];
    return [...plural, ...singular];
  });
  console.log("🛠️ Current selectedServices:", selectedServices);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<"after" | "card">("after");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");

  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // --- Helpers ---
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // --- Effects ---

  // Fetch User Profile for Addresses
  useEffect(() => {
    if (user?.id) {
      UserService.getUserProfile(user.id).then(profile => {
        setUserProfile(profile);
        // If user has addresses, assume saved mode, else new
        if (profile.addresses && profile.addresses.length > 0) {
          setAddressMode("saved");
        } else {
          setAddressMode("new");
        }
      }).catch(err => console.error("Failed to load profile", err));
    }
  }, [user]);

  // Auto-detect size for new car form
  useEffect(() => {
    if (vehicleMake || vehicleModel) {
      setDetectedSize(classifyVehicle(`${vehicleMake} ${vehicleModel}`));
    }
  }, [vehicleMake, vehicleModel]);

  useEffect(() => {
    const fetchSlots = async () => {
      setTimeSlot("");
      setSelectedSlotRaw("");
      if (date && initialState?.carwashId) {
        setIsLoadingSlots(true);
        try {
          const slots = await BookingService.getAvailableSlots(initialState.carwashId, date);
          setAvailableSlots(slots);
        } catch (error) {
          console.error("Failed to fetch slots", error);
          toast.error("Could not load time slots");
        } finally {
          setIsLoadingSlots(false);
        }
      }
    };
    fetchSlots();
  }, [date, initialState?.carwashId]);

  useEffect(() => {
    if (initialState?.carwashId) {
      CarwashService.getCarwashById(initialState.carwashId)
        .then((data) => {
          const carwashData = (data as any).data || data;
          setCarwash(carwashData);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch carwash", err);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [initialState?.carwashId]);

  // Distance Validation Effect
  useEffect(() => {
    if (serviceType === "home" && userCoordinates && carwash?.location?.coordinates) {
      const uLng = userCoordinates[0];
      const uLat = userCoordinates[1];
      const cwLng = carwash.location.coordinates[0];
      const cwLat = carwash.location.coordinates[1];

      const dist = calculateHaversineDistance(uLat, uLng, cwLat, cwLng);
      setDistanceKm(dist);

      const radius = carwash.delivery_radius_km || 10; // default to 10 if missing
      setIsWithinRadius(dist <= radius);
    } else {
      setDistanceKm(null);
      setIsWithinRadius(null);
    }
  }, [serviceType, userCoordinates, carwash]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const cars = await CarService.getMyCars();
        // Ensure every car has a size, even if not in DB
        const enrichedCars = cars.map(car => ({
          ...car,
          size: car.size || classifyVehicle(car.model)
        }));
        setMyCars(enrichedCars);
        if (enrichedCars.length > 0) {
          setSelectedCarId(enrichedCars[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch cars", error);
      }
    };
    fetchCars();
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      // Handle both {data: {balance: X}} and {balance: X} structures
      const balance = data?.data?.balance ?? data?.balance ?? 0;
      setWalletBalance(balance);
      console.log("💰 Wallet balance fetched:", balance);
    } catch (err) {
      console.error("❌ Failed to fetch wallet balance:", err);
    }
  };

  // --- Helpers ---

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const calculateTotal = () => {
    // 1. Calculate base price from size
    let base = 0;
    const selectedCar = myCars.find(c => c.id === selectedCarId);
    const size = selectedCar?.size || (selectedCarId === "new" ? detectedSize : "medium");
    
    if (carwash?.pricing_matrix) {
      base = carwash.pricing_matrix[size as VehicleSize] || carwash.pricing_matrix["medium"] || 5000;
    } else {
      base = carwash?.base_price || 5000;
    }

    // 2. Add all selected services
    const servicesTotal = selectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

    // 3. Add all selected add-ons
    const addonsTotal = selectedAddons.reduce((sum, name) => {
      const addon = carwash?.addons?.find((a: any) => a.name === name);
      return sum + (Number(addon?.price) || 0);
    }, 0);

    return base + servicesTotal + addonsTotal;
  };

  const convertTo24Hour = (timeStr: string) => {
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr)) {
      return `${timeStr}:00`;
    }
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  };

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        if (serviceType === "home") {
          // If in "saved" mode but explicitly didn't pick one (shouldn't happen with radio but still)
          if (addressMode === "saved" && !clientAddress) {
            toast.error("Please select a saved address or use a new one");
            return false;
          }
          if (addressMode === "new" && (!clientAddress.trim() || !userCoordinates)) {
            toast.error("Please enter and select your address for home service");
            return false;
          }
          if (isWithinRadius === false) {
            toast.error(`You are outside the service range (${distanceKm?.toFixed(1)}km). Direct limit is ${carwash?.delivery_radius_km || 10}km.`);
            return false;
          }
        }
        return true;
      case 2:
        if (!date || !timeSlot) {
          toast.error("Please select both date and time");
          return false;
        }
        return true;
      case 3:
        if (selectedCarId === "new") {
          if (!vehicleMake || !vehicleModel || !vehicleYear || !vehicleColor || !vehiclePlate) {
            toast.error("Please fill in all vehicle details");
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!user) {
      toast.error("Please login to continue booking");
      // Save current booking state to localStorage or pass in state to login for redirect
      // For MVP, simple redirect
      navigate("/login", { state: { from: location } });
      return;
    }

    if (validateStep(step)) {
      setDirection(1);
      setStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleConfirmBooking = async () => {
    if (paymentMethod === "card" && (!cardNumber || !expiryDate || !cvc)) {
      toast.error("Please fill in all card details");
      return;
    }

    const total = calculateTotal();
    const token = localStorage.getItem("authToken");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // ── Step 1: Check wallet balance before proceeding ──
    try {
      console.log("🔍 Verifying wallet for total:", total);
      const res = await fetch(`${API_BASE_URL}/wallet`, {
        headers,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error(`Wallet verification failed with status: ${res.status}`);
      }

      const walletData = await res.json();
      const balance = walletData?.data?.balance ?? walletData?.balance ?? 0;
      console.log("✅ Current balance for verification:", balance);

      if (balance < total) {
        const shortfall = total - balance;
        toast.error(
          `Insufficient wallet balance. You need ₦${shortfall.toLocaleString()} more.`,
          {
            action: {
              label: "Top Up Wallet",
              onClick: () => navigate("/wallet"),
            },
            duration: 8000,
          }
        );
        return;
      }
    } catch (error) {
      console.error("🚨 Wallet Check Error:", error);
      toast.error("Could not verify wallet balance. Please ensure you are logged in and try again.");
      return;
    }

    try {
      let finalCarId = selectedCarId;
      if (selectedCarId === "new") {
        const car = await CarService.createCar({
          model: `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
          plate: vehiclePlate.toUpperCase(),
          size: detectedSize,
          color: vehicleColor,
          is_default: false
        });
        finalCarId = car.id;
      }

      const bookingDateTime = selectedSlotRaw ? new Date(selectedSlotRaw) : new Date(`${date}T${convertTo24Hour(timeSlot)}`);

      const userLocation = serviceType === "home" && userCoordinates
        ? { type: 'Point', coordinates: userCoordinates }
        : undefined;

      const payload: any = {
        car_id: finalCarId,
        carwash_id: initialState.carwashId,
        booking_time: bookingDateTime.toISOString(),
        booking_type: (serviceType === "home" ? "home_service" : "slot_booking") as "home_service" | "slot_booking",
        user_location: userLocation as any,
        address_note: clientAddress,
        notes: `Services: ${selectedServices.map(s => s.name).join(", ") || "Basic Wash Only"} \nAdd-ons: ${selectedAddons.join(", ") || "None"} \nInstructions: ${specialInstructions}`,
        services: selectedServices.map(s => s.id || s._id).filter(id => !!id),
        total_price: total,
        status: "pending"
      };

      if (serviceType === "home" && (!userCoordinates || userCoordinates[0] === 0)) {
        toast.error("Please pick a valid location for home service.");
        return;
      }

      // ── Step 2: Create the booking ──
      const response = await BookingService.createBooking(payload);
      const bookingId = (response as any).id || (response as any).data?.id || (response as any)._id;

      // ── Step 3: Hold funds in escrow ──
      if (bookingId) {
        const escrowRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080/api"}/wallet/escrow`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ booking_id: bookingId, amount: total }),
        });
        const escrowData = await escrowRes.json();

        if (escrowData.success) {
          toast.success(`Booking confirmed! ₦${total.toLocaleString()} held in escrow — released when service is complete.`, { duration: 6000 });
        } else {
          // Booking exists but escrow failed — still confirm but warn
          toast.warning("Booking created but payment hold failed. Please contact support.", { duration: 8000 });
        }
      } else {
        toast.success("Booking confirmed! Check your email for details.");
      }

      setTimeout(() => {
        navigate("/dashboard");
      }, 2500);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to create booking. Please try again.";
      toast.error(errorMessage);
    }
  };

  if (!initialState?.carwashId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h1 className="text-3xl font-bold">No Carwash Selected</h1>
          <Button onClick={() => navigate("/dashboard")} size="lg">Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Step {step} of 4</span>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">How would you like your service?</h1>
                <p className="text-muted-foreground">Choose the service mode that suits you best</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${serviceType === "onsite" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}
                  onClick={() => setServiceType("onsite")}
                >
                  <Building2 className={`h-8 w-8 mb-4 ${serviceType === "onsite" ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="font-semibold text-lg mb-2">Visit Carwash</h3>
                  <p className="text-sm text-muted-foreground">Book a slot and drive in to get your car cleaned.</p>
                </div>
                {carwash?.home_service && (
                  <div
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${serviceType === "home" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}
                    onClick={() => setServiceType("home")}
                  >
                    <Home className={`h-8 w-8 mb-4 ${serviceType === "home" ? "text-primary" : "text-muted-foreground"}`} />
                    <h3 className="font-semibold text-lg mb-2">Home Service</h3>
                    <p className="text-sm text-muted-foreground">We come to your location to clean your car.</p>
                  </div>
                )}
              </div>

              {serviceType === "home" && (
                <Card className="animate-in slide-in-from-top-2">
                  <CardHeader>
                    <CardTitle className="text-base">Service Location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Address Mode Selection */}
                    {userProfile?.addresses && userProfile.addresses.length > 0 && (
                      <RadioGroup
                        value={addressMode}
                        onValueChange={(val: "saved" | "new") => {
                          setAddressMode(val);
                          if (val === "new") {
                            setClientAddress("");
                            setUserCoordinates(null);
                          } else {
                            // Optionally reset to first saved address
                            // but better to let user pick below
                          }
                        }}
                        className="flex gap-4 mb-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="saved" id="saved-mode" />
                          <Label htmlFor="saved-mode">Saved Locations</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="new" id="new-mode" />
                          <Label htmlFor="new-mode">New Location</Label>
                        </div>
                      </RadioGroup>
                    )}

                    {addressMode === "saved" && userProfile?.addresses && userProfile.addresses.length > 0 ? (
                      <RadioGroup
                        onValueChange={(addrId) => {
                          const addr = userProfile.addresses?.find(a => a.id === addrId);
                          if (addr) {
                            setClientAddress(addr.address_line);
                            // Ensure we have coords, if not, maybe we should warn or just pass 0,0
                            // The system should have 0,0 at least or real coords
                            const coords: [number, number] = addr.location?.coordinates && addr.location.coordinates.length === 2
                              ? [addr.location.coordinates[0], addr.location.coordinates[1]]
                              : [0, 0];
                            setUserCoordinates(coords);
                          }
                        }}
                        defaultValue={userProfile.addresses.find(a => a.is_default)?.id}
                      >
                        {userProfile.addresses.map((addr) => (
                          <div key={addr.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                            <RadioGroupItem value={addr.id || "temp"} id={addr.id} />
                            <Label htmlFor={addr.id} className="flex-1 cursor-pointer">
                              <div className="font-medium flex items-center gap-2">
                                {addr.label || addr.type} {addr.is_default && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">Default</span>}
                              </div>
                              <div className="text-sm text-muted-foreground">{addr.address_line}</div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="space-y-2">
                        <Label>Search Address / Landmark</Label>
                        <LocationSearchBar
                          onPlaceSelected={(lat, lng, address) => {
                            setUserCoordinates([lng, lat]);
                            setClientAddress(address);
                          }}
                          placeholder="Search your home address..."
                          className="w-full"
                        />
                        {clientAddress && (
                          <p className="text-sm text-muted-foreground mt-2">Selected: {clientAddress}</p>
                        )}
                      </div>
                    )}

                    {serviceType === "home" && distanceKm !== null && (
                      <div className={cn(
                        "p-4 rounded-lg border flex items-start gap-3 mt-2 animate-in fade-in slide-in-from-top-2",
                        isWithinRadius ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"
                      )}>
                        {isWithinRadius ? (
                          <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            {isWithinRadius ? "Eligible for Home Service" : "Outside Service Area"}
                          </p>
                          <p className="text-xs opacity-90">
                            {isWithinRadius
                              ? `Your location is ${distanceKm.toFixed(1)}km away, within our ${carwash?.delivery_radius_km || 10}km radius.`
                              : `Your location is ${distanceKm.toFixed(1)}km away. Our limit is ${carwash?.delivery_radius_km || 10}km.`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">When should we expect you?</h1>
                <p className="text-muted-foreground">Select a convenient date and time</p>
              </div>
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setTimeSlot("");
                      }}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Select Time Slot</Label>
                    {date ? (
                      isLoadingSlots ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                          {availableSlots.map((slot: any, idx: number) => {
                            const dateObj = new Date(slot.start_time);
                            const startTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const isAvailable = serviceType === 'home' || slot.available;
                            return (
                              <Button
                                key={idx}
                                variant={timeSlot === startTime ? "default" : "outline"}
                                className={`
                                  relative overflow-hidden h-14 transition-all duration-200 px-1
                                  ${!isAvailable
                                    ? 'bg-white text-gray-400 border-gray-200 border-dashed hover:bg-white hover:text-gray-400 opacity-100 cursor-not-allowed border-2'
                                    : 'hover:border-primary/50'
                                  }
                                  ${timeSlot === startTime ? 'ring-2 ring-primary ring-offset-2' : ''}
                                `}
                                onClick={() => {
                                  if (isAvailable) {
                                    setTimeSlot(startTime);
                                    setSelectedSlotRaw(slot.start_time);
                                  }
                                }}
                                disabled={!isAvailable}
                              >
                                {!isAvailable ? (
                                  <div className="flex flex-col items-center gap-0.5 scale-90">
                                    <span className="text-xs font-bold text-gray-500">{startTime}</span>
                                    <span className="text-[8px] uppercase font-black text-gray-300">Taken</span>
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold">{startTime}</span>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">No slots available for this date.</div>
                      )
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">Please select a date to view available slots.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">Vehicle & Preferences</h1>
                <p className="text-muted-foreground">Select your car or add a new one</p>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" /> Select Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={selectedCarId} onValueChange={setSelectedCarId}>
                    {myCars.map((car) => (
                      <div key={car.id} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value={car.id} id={car.id} />
                        <Label htmlFor={car.id} className="flex-1 cursor-pointer flex justify-between items-center">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {car.model}
                              <Badge variant="outline" className={cn(
                                "text-[10px] py-0 h-4 capitalize",
                                (car.size || classifyVehicle(car.model)) === 'small' && "border-blue-200 text-blue-700 bg-blue-50",
                                (car.size || classifyVehicle(car.model)) === 'medium' && "border-amber-200 text-amber-700 bg-amber-50",
                                (car.size || classifyVehicle(car.model)) === 'large' && "border-red-200 text-red-700 bg-red-50"
                              )}>
                                {car.size || classifyVehicle(car.model)}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground font-mono uppercase tracking-widest text-[10px] opacity-70">
                              {car.plate} • {car.color}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-primary">
                              ₦{(carwash?.pricing_matrix?.[car.size as VehicleSize] || carwash?.base_price || 5000).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Base Price</div>
                          </div>
                        </Label>
                      </div>
                    ))}
                    <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="new" id="new" />
                      <Label htmlFor="new" className="flex-1 cursor-pointer flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Add New Vehicle
                      </Label>
                    </div>
                  </RadioGroup>
                  {selectedCarId === "new" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Make</Label>
                        <Input placeholder="e.g. Toyota" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Model</Label>
                        <Input placeholder="e.g. Camry" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} />
                        {detectedSize && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Detected Size:</span>
                            <Badge variant="outline" className={cn(
                              "text-[10px] py-0 h-4 capitalize",
                              detectedSize === 'small' && "border-blue-200 text-blue-700 bg-blue-50",
                              detectedSize === 'medium' && "border-amber-200 text-amber-700 bg-amber-50",
                              detectedSize === 'large' && "border-red-200 text-red-700 bg-red-50"
                            )}>
                              {detectedSize}
                            </Badge>
                            <span className="text-[10px] font-bold text-primary ml-auto">
                              ₦{(carwash?.pricing_matrix?.[detectedSize] || carwash?.base_price || 5000).toLocaleString()} base
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input placeholder="e.g. 2022" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <Input placeholder="e.g. Silver" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>License Plate</Label>
                        <Input placeholder="e.g. ABC-123-DE" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Services List (Multi-Select) */}
              <div className="grid gap-3">
                {carwash?.services && carwash.services.length > 0 ? (
                  carwash.services.map((service: any) => {
                    const isSelected = selectedServices.some(s => s.name === service.name);
                    return (
                      <div
                        key={service.name}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedServices(selectedServices.filter(s => s.name !== service.name));
                          } else {
                            setSelectedServices([...selectedServices, service]);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group",
                          isSelected
                            ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20 shadow-sm"
                            : "border-muted hover:border-primary/40 hover:bg-muted/30"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                          isSelected ? "bg-primary border-primary" : "border-muted-foreground/30 group-hover:border-primary/50"
                        )}>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-base">{service.name}</h4>
                            <span className="font-black text-primary">₦{service.price.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 group-hover:line-clamp-none transition-all">
                            {service.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {service.duration} mins
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 border-2 border-dashed rounded-xl bg-muted/20">
                    <p className="text-sm text-muted-foreground">No extra service packages available.</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 mt-4">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Base Wash Included</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    You've already been matched with a <strong>Base Wash</strong> for your <strong>{detectedSize}</strong> vehicle. 
                    Pick any additional upgrades above to customize your experience!
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Add-ons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(carwash?.addons || []).length > 0 ? (
                      (carwash?.addons || []).map((addon: any) => (
                        <div
                          key={addon.name}
                          className="flex items-start space-x-3 p-4 rounded-lg border hover:border-primary cursor-pointer active:scale-[0.98] transition-transform"
                          onClick={() => handleAddonToggle(addon.name)}
                        >
                          <Checkbox checked={selectedAddons.includes(addon.name)} />
                          <div className="flex-1">
                            <div className="font-medium">{addon.name}</div>
                            <div className="text-sm text-primary font-semibold">+₦{addon.price.toLocaleString()}</div>
                            {addon.description && <div className="text-xs text-muted-foreground mt-1">{addon.description}</div>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center text-muted-foreground py-4">
                        No add-ons available for this car wash.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Special Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Any specific instructions for the team? (e.g. 'Park in the driveway', 'Don't wash the roof')"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">Review & Confirm</h1>
                <p className="text-muted-foreground">Double check your booking details</p>
              </div>

              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Service Mode</span>
                      <p className="font-medium capitalize">{serviceType === "onsite" ? "Visit Carwash" : "Home Service"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date & Time</span>
                      <p className="font-medium">{date} at {timeSlot}</p>
                    </div>
                    {selectedServices.some(s => s.duration) && (
                      <div>
                        <span className="text-muted-foreground">Est. Duration</span>
                        <p className="font-medium flex items-center gap-1.5 text-blue-600">
                          <Clock className="h-4 w-4" />
                          {selectedServices.reduce((sum, s) => sum + (s.duration || 0), 30)} mins
                        </p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Vehicle</span>
                      <p className="font-medium">
                        {selectedCarId === "new"
                          ? `${vehicleMake} ${vehicleModel} (${vehiclePlate})`
                          : myCars.find(c => c.id === selectedCarId)?.model
                        }
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Standard Base Wash</span>
                        {selectedCarId !== "new" && (
                          <Badge variant="outline" className="text-[9px] h-3.5 w-fit px-1 uppercase font-black tracking-tighter opacity-80">
                            {myCars.find(c => c.id === selectedCarId)?.size || "medium"}
                          </Badge>
                        )}
                        {selectedCarId === "new" && (
                          <Badge variant="outline" className="text-[9px] h-3.5 w-fit px-1 uppercase font-black tracking-tighter opacity-80">
                            {detectedSize}
                          </Badge>
                        )}
                      </div>
                      <span className="font-semibold">
                        ₦{(carwash?.pricing_matrix?.[(myCars.find(c => c.id === selectedCarId)?.size || (selectedCarId === "new" ? detectedSize : "medium")) as VehicleSize] || carwash?.base_price || 5000).toLocaleString()}
                      </span>
                    </div>

                    {selectedServices.length > 0 && (
                      <div className="space-y-2 pt-1 border-t border-dashed">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Service Upgrades</span>
                        {selectedServices.map(service => (
                          <div key={service.name} className="flex justify-between items-center text-sm">
                            <span className="font-semibold">{service.name}</span>
                            <span className="font-bold text-primary">+₦{service.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedAddons.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-dashed">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Selected Add-ons</span>
                        {selectedAddons.map(name => {
                          const addon = carwash?.addons?.find((a: any) => a.name === name);
                          return (
                            <div key={name} className="flex justify-between text-xs font-medium">
                              <span>{addon?.name}</span>
                              <span className="text-primary">+₦{addon?.price.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <Separator />
                    <div className="flex justify-between text-lg font-black pt-1">
                      <span>Total</span>
                      <span className="text-primary">₦{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    <div className={cn(
                      "flex flex-col gap-1 p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                      paymentMethod === "after" ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20" : "border-border hover:border-primary/40"
                    )} onClick={() => setPaymentMethod("after")}>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="after" id="after" />
                        <Label htmlFor="after" className="flex-1 cursor-pointer flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold">
                            <Wallet className="h-4 w-4 text-primary" /> Wallet (Secure Escrow)
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Available Balance</p>
                            <p className="text-sm font-black text-foreground">₦{walletBalance.toLocaleString()}</p>
                          </div>
                        </Label>
                      </div>
                      <div className="ml-7 mt-1">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium italic">
                          <CheckCircle className="h-3 w-3 text-green-500" /> Funds held securely until wash is complete.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer opacity-50">
                      <RadioGroupItem value="card" id="card" disabled />
                      <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-2">
                        <CreditCard className="h-4 w-4" /> Pay with Card (Coming Soon)
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-background/95 backdrop-blur border-t z-50">
          <div className="container mx-auto max-w-3xl flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
              className="h-10 sm:h-11 px-3 sm:px-6 text-sm sm:text-base"
            >
              <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" /> <span className="hidden xs:inline">Back</span>
            </Button>

            {/* Sticky Price Summary (Visible when selecting services or reviewing) */}
            {step >= 3 && (
              <div className="flex flex-col items-center xs:items-end flex-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Est. Total</span>
                <span className="font-black text-base sm:text-xl text-primary leading-none">₦{calculateTotal().toLocaleString()}</span>
              </div>
            )}

            {step < 4 ? (
              <Button
                onClick={nextStep}
                className="h-10 sm:h-11 px-4 sm:px-8 text-sm sm:text-base font-bold shadow-lg shadow-primary/20"
                disabled={step === 1 && serviceType === "home" && (isWithinRadius === false || !userCoordinates)}
              >
                Next <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleConfirmBooking} className="h-10 sm:h-11 px-4 sm:px-8 font-black text-sm sm:text-base bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                Book Securely
              </Button>
            )}
          </div>
        </div>
      </div>
    </div >
  );
};

export default Booking;