import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { LocationSearchBar } from "@/components/LocationSearchBar";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";


interface QuickActionsProps {
  onSearch: (lat: number, lng: number, address: string) => void;
}

export const QuickActions = ({ onSearch }: QuickActionsProps) => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number, address: string } | null>(null);

  const handlePlaceSelected = (lat: number, lng: number, address: string) => {
    console.log("Selected:", address, lat, lng);
    setSelectedLocation({ lat, lng, address });
  };

  const handleSearchClick = () => {
    if (selectedLocation) {
      onSearch(selectedLocation.lat, selectedLocation.lng, selectedLocation.address);
    }
  };

  return (
    <div className="w-full mb-8">
      <div
        className="relative overflow-hidden rounded-3xl bg-cover bg-center shadow-2xl"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        {/* Blue Overlay similar to Hero.tsx but with gradient for better text readability */}
        <div className="absolute inset-0 bg-blue-900/80 backdrop-blur-[2px]" />

        <div className="relative z-10 px-6 py-12 md:py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Looking for a Car Wash?
            </h1>
            <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Find top-rated stations or book a mobile service to come to you.
            </p>
          </motion.div>

          <motion.div
            className="mx-auto max-w-3xl bg-white p-2 rounded-2xl shadow-xl ring-1 ring-black/5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="[&>div]:bg-transparent [&_input]:text-gray-900 [&_input]:placeholder:text-gray-500 [&_input]:pl-11 [&_input]:h-12 [&_input]:text-lg [&_input]:border-none [&_input]:ring-0 [&_input]:shadow-none">
                  <LocationSearchBar
                    onPlaceSelected={handlePlaceSelected}
                    placeholder="Enter Location to search nearby Carwashes..."
                  />
                </div>
              </div>
              <Button
                className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg border border-blue-400/30 transition-all active:scale-95 w-full md:w-auto"
                onClick={handleSearchClick}
                disabled={!selectedLocation}
              >
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

