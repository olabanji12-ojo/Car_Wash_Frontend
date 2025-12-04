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
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Car,
  MapPin,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  CreditCard,
  Wallet,
  ShieldCheck,
  RefreshCcw,
  CheckCircle2,
  Home,
  Building2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import BookingService from "@/Contexts/BookingService";
import CarService, { CarResponse } from "@/Contexts/CarService";
import CarwashService, { Carwash } from "@/Contexts/CarwashService";
import { format } from "date-fns";
import { LocationSearchBar } from "@/components/LocationSearchBar";

interface BookingInitialState {
  carwashId: string;
  // Optional pre-filled data
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

const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialState = location.state as BookingInitialState;

  const [step, setStep] = useState(() => {
    // If we have date and time, and it's onsite (or home with address?? no address is in wizard),
    // we can skip to step 3. But for home service we need address which is step 1.
    if (initialState?.serviceType === "onsite" && initialState?.date && initialState?.timeSlot) {
      return 3;
    }
    return 1;
  });
  const [carwash, setCarwash] = useState<Carwash | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Step 1: Mode & Location
  const [serviceType, setServiceType] = useState<"onsite" | "home">(initialState?.serviceType || "onsite");
  const [clientAddress, setClientAddress] = useState("");
  const [userCoordinates, setUserCoordinates] = useState<[number, number] | null>(null);

  // Step 2: Scheduling
  const [date, setDate] = useState(initialState?.date || "");
  const [timeSlot, setTimeSlot] = useState(initialState?.timeSlot || "");

  // Step 3: Vehicle & Services
  const [myCars, setMyCars] = useState<CarResponse[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string>("new"); // "new" or car ID

  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");

  const [selectedService, setSelectedService] = useState<any>(initialState?.selectedService || null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<"after" | "card" | "mobile">("after");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");

  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Fetch available slots when date changes
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
          // Handle wrapped response if necessary
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

  // Fetch user's cars
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const cars = await CarService.getMyCars();
        setMyCars(cars);
        // If user has cars, select the first one by default
        if (cars.length > 0) {
          setSelectedCarId(cars[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch cars", error);
      }
    };
    fetchCars();
  }, []);

  if (!initialState?.carwashId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h1 className="text-3xl font-bold">No Carwash Selected</h1>
          <Button onClick={() => navigate("/dashboard")} size="lg">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const calculateTotal = () => {
    const servicePrice = selectedService?.price || 0; // Base price is 0 if no service selected
    const addonsPrice = selectedAddons.reduce((total, addonId) => {
      const addon = availableAddons.find(a => a.id === addonId);
      return total + (addon?.price || 0);
    }, 0);
    return servicePrice + addonsPrice;
  };

  const convertTo24Hour = (timeStr: string) => {
    // If it's already in HH:mm format (from time input), just append seconds
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr)) {
      return `${timeStr}:00`;
    }

    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  };

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        if (serviceType === "home" && (!clientAddress.trim() || !userCoordinates)) {
          toast.error("Please enter and select your address for home service");
          return false;
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
      setStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleConfirmBooking = async () => {
    if (paymentMethod === "card" && (!cardNumber || !expiryDate || !cvc)) {
      toast.error("Please fill in all card details");
      return;
    }

    try {
      let finalCarId = selectedCarId;

      // 1. Create Car Profile if "new" is selected
      if (selectedCarId === "new") {
        const car = await CarService.createCar({
          model: `${vehicleYear} ${vehicleMake} ${vehicleModel}`,
          plate: vehiclePlate,
          color: vehicleColor,
        });
        finalCarId = car.id;
      }

      // 2. Create Booking
      const bookingDateTime = new Date(`${date}T${convertTo24Hour(timeSlot)}`);

      // Use user coordinates for home service
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

    } catch (error) {
      console.error(error);
      toast.error("Failed to create booking. Please try again.");
    }
  };

  const timeSlots = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
    "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Step {step} of 4</span>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Step 1: Mode & Location */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label>Your Address</Label>
                  <div className="mt-2">
                    <LocationSearchBar
                      onPlaceSelected={(lat, lng, address) => {
                        // Store as [lng, lat] for GeoJSON
                        setUserCoordinates([lng, lat]);
                        setClientAddress(address);
                      }}
                      placeholder="Search your home address..."
                      className="w-full"
                    />
                  </div>
                  {clientAddress && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {clientAddress}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Scheduling */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                      setTimeSlot(""); // Reset time slot when date changes
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
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableSlots.map((slot: any, idx: number) => {
                          const startTime = new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          // For home service, we ignore the slot capacity (available flag)
                          // For onsite (slot_booking), we respect it.
                          const isAvailable = serviceType === 'home' || slot.available;

                          return (
                            <Button
                              key={idx}
                              variant={timeSlot === startTime ? "default" : "outline"}
                              className={`text-xs sm:text-sm ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => isAvailable && setTimeSlot(startTime)}
                              disabled={!isAvailable}
                            >
                              {startTime}
                              {!isAvailable && <span className="ml-1 text-[10px]">(Full)</span>}
                            </Button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No slots available for this date.
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Please select a date to view available slots.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Vehicle & Services */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Vehicle & Preferences</h1>
              <p className="text-muted-foreground">Select your car or add a new one</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  Select Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={selectedCarId} onValueChange={setSelectedCarId}>
                  {myCars.map((car) => (
                    <div key={car.id} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value={car.id} id={car.id} />
                      <Label htmlFor={car.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{car.model}</div>
                        <div className="text-sm text-muted-foreground">
                          {car.plate} • {car.color}
                        </div>
                      </Label>
                    </div>
                  ))}

                  <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add New Vehicle
                    </Label>
                  </div>
                </RadioGroup>

                {selectedCarId === "new" && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t animate-in slide-in-from-top-2">
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
                      <Label htmlFor={service.name} className="flex-1 cursor-pointer flex justify-between">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-muted-foreground">{service.description}</div>
                        </div>
                        <div className="font-bold text-primary">₦{service.price.toLocaleString()}</div>
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
                    className="flex items-start space-x-3 p-4 rounded-lg border hover:border-primary cursor-pointer"
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
          </div>
        )}

        {/* Step 4: Review & Payment */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                  <div>
                    <span className="text-muted-foreground">Vehicle</span>
                    <p className="font-medium">
                      {selectedCarId === "new"
                        ? `${vehicleMake} ${vehicleModel} (${vehiclePlate})`
                        : myCars.find(c => c.id === selectedCarId)?.model
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Package</span>
                    <p className="font-medium">{selectedService?.name || "Basic Slot"}</p>
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
                      <Wallet className="h-4 w-4" /> Pay After Service
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Pay with Card
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "card" && (
                  <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                    <Input placeholder="Card Number" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="MM/YY" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                      <Input placeholder="CVC" value={cvc} onChange={e => setCvc(e.target.value)} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="container mx-auto max-w-3xl flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
              className="w-32"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {step < 4 ? (
              <Button onClick={nextStep} className="w-32">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleConfirmBooking} className="w-32">
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
