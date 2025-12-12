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
  MapPin
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import BookingService from "@/Contexts/BookingService";
import CarService, { CarResponse } from "@/Contexts/CarService";
import CarwashService, { Carwash } from "@/Contexts/CarwashService";
import UserService, { UserProfile } from "@/Contexts/UserService";
import { useAuth } from "@/Contexts/AuthContext";
import { LocationSearchBar } from "@/components/LocationSearchBar";

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

  // Step 2: Scheduling
  const [date, setDate] = useState(initialState?.date || "");
  const [timeSlot, setTimeSlot] = useState(initialState?.timeSlot || "");

  // Step 3: Vehicle & Services
  const [myCars, setMyCars] = useState<CarResponse[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string>("new");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");

  const [selectedService, setSelectedService] = useState<any>(initialState?.selectedService || null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<"after" | "card">("after");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");

  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

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
    const servicePrice = selectedService?.price || 0;
    const addonsPrice = selectedAddons.reduce((total, addonId) => {
      const addon = availableAddons.find(a => a.id === addonId);
      return total + (addon?.price || 0);
    }, 0);
    return servicePrice + addonsPrice;
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

      const bookingDateTime = new Date(`${date}T${convertTo24Hour(timeSlot)}`);
      const userLocation = serviceType === "home" && userCoordinates
        ? { type: 'Point', coordinates: userCoordinates }
        : undefined;

      await BookingService.createBooking({
        car_id: finalCarId,
        carwash_id: initialState.carwashId,
        booking_time: bookingDateTime.toISOString(),
        booking_type: serviceType === "home" ? "home_service" : "slot_booking",
        user_location: userLocation as any,
        address_note: clientAddress,
        notes: `Service: ${selectedService?.name || "Basic Slot"} \nInstructions: ${specialInstructions}`,
        status: "pending"
      });

      toast.success("Booking confirmed successfully!");
      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.error || "Failed to create booking. Please try again.";
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
                <div
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${serviceType === "home" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}
                  onClick={() => setServiceType("home")}
                >
                  <Home className={`h-8 w-8 mb-4 ${serviceType === "home" ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="font-semibold text-lg mb-2">Home Service</h3>
                  <p className="text-sm text-muted-foreground">We come to your location to clean your car.</p>
                </div>
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
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {availableSlots.map((slot: any, idx: number) => {
                            const startTime = new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const isAvailable = serviceType === 'home' || slot.available;
                            return (
                              <Button
                                key={idx}
                                variant={timeSlot === startTime ? "default" : "outline"}
                                className={`
                                  relative overflow-hidden text-xs sm:text-sm h-12
                                  ${!isAvailable
                                    ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-50 hover:text-red-500 opacity-100 cursor-not-allowed'
                                    : ''
                                  }
                                `}
                                onClick={() => isAvailable && setTimeSlot(startTime)}
                                disabled={!isAvailable}
                              >
                                {isAvailable ? startTime : (
                                  <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-bold line-through opacity-70">{startTime}</span>
                                    <span className="text-[10px] font-bold">TAKEN</span>
                                  </div>
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
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
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
                        <div className="text-sm text-muted-foreground">Standard wash slot reservation</div>
                      </Label>
                    </div>
                    {carwash?.services?.map((service: any, idx: number) => (
                      <div key={idx} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value={service.name} id={service.name} />
                        <Label htmlFor={service.name} className="flex-1 cursor-pointer flex justify-between items-center sm:items-start">
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground">{service.description}</div>
                          </div>
                          <div className="font-bold text-primary whitespace-nowrap ml-2">₦{service.price.toLocaleString()}</div>
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
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  {availableAddons.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex items-start space-x-3 p-4 rounded-lg border hover:border-primary cursor-pointer active:scale-[0.98] transition-transform"
                      onClick={() => handleAddonToggle(addon.id)}
                    >
                      <Checkbox checked={selectedAddons.includes(addon.id)} />
                      <div className="flex-1">
                        <div className="font-medium">{addon.name}</div>
                        <div className="text-sm text-primary font-semibold">+₦{addon.price.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
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
                    <div className="flex justify-between">
                      <span>Base Price</span>
                      <span>₦{(selectedService?.price || 0).toLocaleString()}</span>
                    </div>
                    {selectedAddons.map(id => {
                      const addon = availableAddons.find(a => a.id === id);
                      return (
                        <div key={id} className="flex justify-between text-sm text-muted-foreground">
                          <span>{addon?.name}</span>
                          <span>+₦{addon?.price.toLocaleString()}</span>
                        </div>
                      );
                    })}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t z-50">
          <div className="container mx-auto max-w-3xl flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
              className="w-24 sm:w-32"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {/* Sticky Price Summary (Visible when selecting services or reviewing) */}
            {step >= 3 && (
              <div className="flex flex-col items-end px-2 sm:px-4">
                <span className="text-xs text-muted-foreground uppercase">Total</span>
                <span className="font-bold text-lg text-primary">₦{calculateTotal().toLocaleString()}</span>
              </div>
            )}

            {step < 4 ? (
              <Button onClick={nextStep} className="w-24 sm:w-32">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleConfirmBooking} className="w-24 sm:w-32">
                Confirm
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
