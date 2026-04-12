import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin } from "lucide-react";
import { LocationSearchBar } from "@/components/LocationSearchBar";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

interface QuickActionsProps {
  onSearch: (lat: number, lng: number, address: string, mode: 'station' | 'home', radiusKm?: number) => void;
}

export const QuickActions = ({ onSearch }: QuickActionsProps) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [serviceMode, setServiceMode] = useState<'station' | 'home'>('station');
  const [radiusKm, setRadiusKm] = useState(5); // Default 5km

  const handlePlaceSelected = (lat: number, lng: number, address: string) => {
    if (lat && lng) {
      setSelectedLocation({ lat, lng, address });
    } else {
      setSelectedLocation(null);
    }
  };

  const handleSearchClick = () => {
    if (selectedLocation) {
      onSearch(selectedLocation.lat, selectedLocation.lng, selectedLocation.address, serviceMode, radiusKm);
    }
  };

  return (
    <div className="w-full mb-8">
      <div
        className="relative overflow-hidden rounded-3xl bg-cover bg-center shadow-2xl"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
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
            {/* Service Type Toggle */}
            <div className="flex justify-center mb-4">
              <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex flex-wrap justify-center gap-2 border border-white/20">
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

            {/* Search Bar Row */}
            <div className="bg-white p-2 rounded-2xl shadow-xl ring-1 ring-black/5 flex flex-col md:flex-row gap-2 sm:gap-3">
              <div className="flex-1 relative group min-w-0">
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="[&>div]:bg-transparent [&_input]:text-gray-900 [&_input]:placeholder:text-gray-400 [&_input]:pl-10 sm:[&_input]:pl-11 [&_input]:h-10 sm:[&_input]:h-12 [&_input]:text-base sm:[&_input]:text-lg [&_input]:border-none [&_input]:ring-0 [&_input]:shadow-none w-full">
                  <LocationSearchBar
                    onPlaceSelected={handlePlaceSelected}
                    placeholder={serviceMode === 'home' ? "Where should we come to?" : "Enter your street or area..."}
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

            {/* Radius Slider — shown after a location is selected */}
            {selectedLocation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-xs font-bold uppercase tracking-widest">Search Radius</span>
                  <span className="text-white font-black text-sm">{radiusKm} km</span>
                </div>
                <Slider
                  min={1}
                  max={20}
                  step={1}
                  value={[radiusKm]}
                  onValueChange={(val) => setRadiusKm(val[0])}
                  className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-none [&_.range]:bg-white/60"
                />
                <div className="flex justify-between text-white/50 text-[10px] mt-1">
                  <span>1 km</span>
                  <span>20 km</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
