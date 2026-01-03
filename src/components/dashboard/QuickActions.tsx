import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { LocationSearchBar } from "@/components/LocationSearchBar";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";


interface QuickActionsProps {
  onSearch: (lat: number, lng: number, address: string, mode: 'station' | 'home') => void;
}

export const QuickActions = ({ onSearch }: QuickActionsProps) => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number, address: string } | null>(null);
  const [serviceMode, setServiceMode] = useState<'station' | 'home'>('station');

  const handlePlaceSelected = (lat: number, lng: number, address: string) => {
    console.log("Selected:", address, lat, lng);
    setSelectedLocation({ lat, lng, address });
  };

  const handleSearchClick = () => {
    if (selectedLocation) {
      onSearch(selectedLocation.lat, selectedLocation.lng, selectedLocation.address, serviceMode);
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

        <div className="relative z-10 px-4 py-8 md:px-6 md:py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white mb-3 md:mb-4 tracking-tight">
              Looking for a Car Wash?
            </h1>
            <p className="text-blue-100 text-sm sm:text-base md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto">
              Find top-rated stations or book a mobile service to come to you.
            </p>
          </motion.div>

          <motion.div
            className="mx-auto max-w-3xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Service Type Toggle Capsules */}
            <div className="flex justify-center mb-4">
              <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex gap-2 border border-white/20">
                <button
                  onClick={() => setServiceMode('station')}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${serviceMode === 'station'
                    ? "bg-white text-blue-900 shadow-lg"
                    : "text-white hover:bg-white/10"
                    }`}
                >
                  Visit Station
                </button>
                <button
                  onClick={() => setServiceMode('home')}
                  className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${serviceMode === 'home'
                    ? "bg-white text-blue-900 shadow-lg"
                    : "text-white hover:bg-white/10"
                    }`}
                >
                  Home Service
                </button>
              </div>
            </div>

            <div className="bg-white p-2 rounded-2xl shadow-xl ring-1 ring-black/5 flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="[&>div]:bg-transparent [&_input]:text-gray-900 [&_input]:placeholder:text-gray-500 [&_input]:pl-11 [&_input]:h-12 [&_input]:text-lg [&_input]:border-none [&_input]:ring-0 [&_input]:shadow-none">
                  <LocationSearchBar
                    onPlaceSelected={handlePlaceSelected}
                    placeholder={serviceMode === 'home' ? "Where should we come to?" : "Enter Location to search nearby Carwashes..."}
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

