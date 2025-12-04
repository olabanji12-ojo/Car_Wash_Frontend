import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { LocationSearchBar } from "@/components/LocationSearchBar";

interface QuickActionsProps {
  onSearch: (lat: number, lng: number) => void;
}

export const QuickActions = ({ onSearch }: QuickActionsProps) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);

  const handlePlaceSelected = (lat: number, lng: number, address: string) => {
    console.log("Selected:", address, lat, lng);
    setSelectedLocation({ lat, lng });
  };

  const handleSearchClick = () => {
    if (selectedLocation) {
      onSearch(selectedLocation.lat, selectedLocation.lng);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Find Carwashes Near You</CardTitle>
          <CardDescription>
            Discover top-rated carwashes and book services instantly, ensuring a pristine clean every time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <LocationSearchBar
              onPlaceSelected={handlePlaceSelected}
              placeholder="Enter your location (e.g. Lagos, Alimosho)"
            />
            <Button className="w-full" onClick={handleSearchClick} disabled={!selectedLocation}>
              <Search className="mr-2 h-4 w-4" />
              Search Nearby
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Book Home Service</CardTitle>
          <CardDescription>
            Enjoy professional carwash services right at your doorstep, convenience redefined.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="secondary">
            Schedule Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
