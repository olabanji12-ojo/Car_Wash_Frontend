import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Heart, Clock as ClockIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/Contexts/FavoritesContext";
import { Carwash } from "@/Contexts/CarwashService";

interface CarwashCardProps {
  carwash: Carwash;
}

export const CarwashCard = ({ carwash }: CarwashCardProps) => {
  const navigate = useNavigate();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const isFav = isFavorite(carwash.id);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFav) {
      removeFavorite(carwash.id);
    } else {
      addFavorite(carwash);
    }
  };

  return (
    <Card
      className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-none bg-white/50 backdrop-blur-sm ring-1 ring-gray-200/50 cursor-pointer"
      onClick={() => navigate(`/carwash/${carwash.id}`)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={carwash.photo_gallery?.[0] || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=300&fit=crop"}
            alt={carwash.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <Badge
              variant={carwash.is_active ? "default" : "secondary"}
              className={`${carwash.is_active ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-500"} border-none shadow-sm backdrop-blur-md`}
            >
              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${carwash.is_active ? "bg-white animate-pulse" : "bg-gray-300"}`} />
              {carwash.is_active ? "Open Now" : "Closed"}
            </Badge>

            {carwash.distance_text && (
              <Badge variant="secondary" className="bg-white/90 text-indigo-600 border-none shadow-sm backdrop-blur-md font-medium">
                <MapPin className="w-3 h-3 mr-1" />
                {carwash.distance_text}
              </Badge>
            )}

            {carwash.search_mode === 'home' && carwash.home_service && carwash.distance_km !== undefined && carwash.delivery_radius_km !== undefined && carwash.distance_km > carwash.delivery_radius_km && (
              <Badge variant="destructive" className="bg-red-500/90 text-white border-none shadow-sm backdrop-blur-md">
                Out of Range (Home)
              </Badge>
            )}

            {carwash.search_mode === 'home' && !carwash.home_service && (
              <Badge variant="outline" className="bg-orange-500/90 text-white border-none shadow-sm backdrop-blur-md">
                Station Only
              </Badge>
            )}

            {carwash.search_mode === 'home' && carwash.home_service && carwash.distance_km !== undefined && carwash.delivery_radius_km !== undefined && carwash.distance_km <= carwash.delivery_radius_km && (
              <Badge className="bg-blue-500/90 text-white border-none shadow-sm backdrop-blur-md">
                Mobile Service Available
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-sm backdrop-blur-md z-10 transition-colors"
            onClick={toggleFavorite}
          >
            <Heart className={`h-4.5 w-4.5 transition-all ${isFav ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
          </Button>

          {/* Price Overlay or Bottom Info */}
          <div className="absolute bottom-3 right-3">
            <div className="bg-white/95 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md border border-white/20">
              <p className="text-sm font-bold text-indigo-700">
                {carwash.services?.[0]?.price ? `₦${carwash.services[0].price.toLocaleString()}` : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base truncate pr-2 group-hover:text-indigo-600 transition-colors">
                {carwash.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{carwash.address}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 w-fit px-1.5 py-0.5 rounded">
                <ClockIcon className="h-3 w-3 flex-shrink-0" />
                <span>Est. Wait: 15-25 mins</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-100/50">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-yellow-400/10 px-1.5 py-0.5 rounded text-yellow-700">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500 mr-1" />
                <span className="text-xs font-bold">{carwash.rating || "0.0"}</span>
              </div>
              {carwash.review_count !== undefined && (
                <span className="text-[11px] text-gray-400 font-medium tracking-tight">
                  {carwash.review_count} reviews
                </span>
              )}
            </div>

            <Button
              size="sm"
              className="h-8 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/carwash/${carwash.id}`);
              }}
            >
              Book Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
