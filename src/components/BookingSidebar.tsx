import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MapPin, Calendar as CalendarIcon, Home, Building2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BookingSidebarProps {
  carwashId: string;
  startingPrice: number;
  services: Array<{
    name: string;
    description: string;
    price: number;
    features: string[];
  }>;
  phone: string;
}

const BookingSidebar = ({ carwashId, startingPrice, services, phone }: BookingSidebarProps) => {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState<"onsite" | "home">("onsite");
  const [selectedService, setSelectedService] = useState("");

  const handleQuickBooking = () => {
    // Optional: Validate only if they started selecting things
    // But for now, let's just pass whatever they have selected

    const bookingData = {
      carwashId,
      serviceType,
      selectedService: services.find(s => s.name === selectedService),
    };

    // Navigate to booking page with state
    navigate("/booking", { state: bookingData });
  };

  return (
    <div className="lg:sticky lg:top-24 space-y-4">
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle>Quick Booking</CardTitle>
          <p className="text-sm text-muted-foreground">
            Starting from ₦{startingPrice.toLocaleString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Service Type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Service Type</Label>
            <RadioGroup value={serviceType} onValueChange={(value: any) => setServiceType(value)}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="onsite" id="onsite" />
                <Label htmlFor="onsite" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>On-site Service</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="home" id="home" />
                <Label htmlFor="home" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Home className="h-4 w-4 text-primary" />
                  <span>Home Service</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Select Service - Only show if services exist */}
          {services && services.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Select Service (Optional)</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.name} value={service.name}>
                      <div className="flex items-center justify-between w-full">
                        <span>{service.name}</span>
                        <span className="ml-2 text-primary font-semibold">
                          ₦{service.price.toLocaleString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date & Time Selection has been moved to the main booking flow 
              to ensure users see real-time availability */ }

          <Button
            className="w-full"
            size="lg"
            onClick={handleQuickBooking}
          >
            Continue to Schedule
          </Button>
        </CardContent>
      </Card>

      {/* Contact Card */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Button variant="outline" className="w-full gap-2" asChild>
            <a href={`tel:${phone}`}>
              <Phone className="h-4 w-4" />
              Call Us
            </a>
          </Button>
          <Button variant="outline" className="w-full gap-2">
            <MapPin className="h-4 w-4" />
            Get Directions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingSidebar;
