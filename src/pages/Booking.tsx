import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  MapIcon,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import BookingService from "@/Contexts/BookingService";
import CarService, { CarResponse } from "@/Contexts/CarService";
import CarwashService, { Carwash } from "@/Contexts/CarwashService";
import UserService, { UserProfile } from "@/Contexts/UserService";
import { useAuth } from "@/Contexts/AuthContext";
import { LocationSearchBar } from "@/components/LocationSearchBar";
import { cn } from "@/lib/utils";

interface BookingInitialState {
  carwashId: string;
  serviceType?: "onsite" | "home";
  selectedService?: {
    name: string;
    description: string;
    price: number;
    features: string[];
  };
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

  const [selectedService, setSelectedService] = useState<any>(initialState?.selectedService || null);
  console.log("🛠️ Current selectedService:", selectedService);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<"after" | "card">("after");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");

  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

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
        setMyCars(cars);
        if (cars.length > 0) {
          setSelectedCarId(cars[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch cars", error);
      }
    };
    fetchCars();
  }, []);

  // --- Helpers ---

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const calculateTotal = () => {
    // Additive Logic: Base Price + Selected Service Upgrade + Selected Add-ons
    const baseWashPrice = carwash?.base_price || 5000;
    const serviceUpgradePrice = selectedService?.price || 0;

    const addonsPrice = (selectedAddons || []).reduce((total, addonName) => {
      const addon = carwash?.addons?.find((a: any) => a.name === addonName);
      return total + (Number(addon?.price) || 0);
    }, 0);

    return baseWashPrice + serviceUpgradePrice + addonsPrice;
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
        if (!selectedService && !selectedSlotRaw) {
          // If no specific service is picked, we at least need them to confirm they want a basic slot
          // This addresses the "without explicit user intent" issue
          toast.error("Please select a service or confirm a basic slot booking");
          return false;
        }
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

    try {
      let finalCarId = selectedCarId;
      if (selectedCarId === "new") {
        const car = await CarService.createCar({
          model: `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
          plate: vehiclePlate,
          color: vehicleColor,
        });
        finalCarId = car.id;
      }

      const bookingDateTime = selectedSlotRaw ? new Date(selectedSlotRaw) : new Date(`${date}T${convertTo24Hour(timeSlot)}`);

      // Step 0: Detailed Logging (Step-by-step debug)
      console.log("🚀 Initializing Booking Creation...");
      console.log("📍 Service Type:", serviceType);
      console.log("🛰️ User Coordinates:", userCoordinates);

      const userLocation = serviceType === "home" && userCoordinates
        ? { type: 'Point', coordinates: userCoordinates }
        : undefined;

      const payload = {
        car_id: finalCarId,
        carwash_id: initialState.carwashId,
        booking_time: bookingDateTime.toISOString(),
        booking_type: (serviceType === "home" ? "home_service" : "slot_booking") as "home_service" | "slot_booking",
        user_location: userLocation as any,
        address_note: clientAddress,
        notes: `Service: ${selectedService?.name || "Basic Slot"} \nAdd-ons: ${selectedAddons.join(", ") || "None"} \nInstructions: ${specialInstructions}`,
        status: "pending"
      };

      console.log("📦 Outgoing Payload:", JSON.stringify(payload, null, 2));

      // Extra check: If home service but no coords, stop early
      if (serviceType === "home" && (!userCoordinates || userCoordinates[0] === 0)) {
        console.error("🛑 Blocked: Missing valid geolocation for home service.");
        toast.error("Please pick a valid location on the map/search before booking a home service.");
        return;
      }

      const response = await BookingService.createBooking(payload);
      console.log("✅ Booking Success:", response);

      toast.success("Booking confirmed! Check your email to see that your booking has been confirmed.");
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);

    } catch (error: any) {
      console.error("❌ Booking Error Caught:", error);

      // Go backend standard response uses .message for error descriptions
      const backendMessage = error.response?.data?.message;
      const genericMessage = "Failed to create booking. Please try again.";
      const errorMessage = backendMessage || error.response?.data?.error || genericMessage;

      console.log("📡 Backend Message:", backendMessage);
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
                        <Label htmlFor={car.id} className="flex-1 cursor-pointer">
                          <div className="font-medium">{car.model}</div>
                          <div className="text-sm text-muted-foreground">{car.plate} • {car.color}</div>
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

              <Card>
                <CardHeader>
                  <CardTitle>Service Package (Optional)</CardTitle>
                  <CardDescription>Select a specific package or skip for a basic slot booking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={selectedService?.name || "basic"}
                    onValueChange={(val) => {
                      if (val === "basic") setSelectedService(null);
                      else setSelectedService(carwash?.services?.find((s: any) => s.name === val));
                    }}
                  >
                    <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="basic" id="basic" />
                      <Label htmlFor="basic" className="flex-1 cursor-pointer">
                        <div className="font-medium">Basic Slot Booking</div>
                        <div className="text-sm text-muted-foreground">Standard wash slot reservation (₦{(carwash?.base_price || 5000).toLocaleString()})</div>
                      </Label>
                    </div>
                    {carwash?.services?.map((service: any, idx: number) => (
                      <div key={idx} className="flex items-center space-x-3 p-3 sm:p-4 rounded-xl border hover:bg-muted/50 cursor-pointer active:scale-[0.99] transition-transform">
                        <RadioGroupItem value={service.name} id={service.name} />
                        <Label htmlFor={service.name} className="flex-1 cursor-pointer flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <div className="font-bold text-sm sm:text-base truncate">{service.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2 leading-tight mt-0.5">{service.description}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <div className="font-black text-primary text-sm sm:text-base whitespace-nowrap">₦{service.price.toLocaleString()}</div>
                            {service.duration && (
                              <div className="flex items-center gap-1 text-[9px] sm:text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                <Clock className="h-3 w-3" />
                                {service.duration}m
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

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
                    {selectedService?.duration && (
                      <div>
                        <span className="text-muted-foreground">Est. Duration</span>
                        <p className="font-medium flex items-center gap-1.5 text-blue-600">
                          <Clock className="h-4 w-4" />
                          {selectedService.duration} mins
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
                      <span className="text-muted-foreground">Standard Base Wash</span>
                      <span className="font-semibold">₦{(carwash?.base_price || 5000).toLocaleString()}</span>
                    </div>

                    {selectedService && (
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Service Upgrade</span>
                          <span className="font-semibold">{selectedService.name}</span>
                        </div>
                        <span className="font-bold text-primary">+₦{selectedService.price.toLocaleString()}</span>
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
                    <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="after" id="after" />
                      <Label htmlFor="after" className="flex-1 cursor-pointer flex items-center gap-2">
                        <Wallet className="h-4 w-4" /> Pay After Service (Free for MVP)
                      </Label>
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
