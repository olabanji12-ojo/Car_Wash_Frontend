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
      className="group overflow-hidden hover:shadow-card-hover transition-all duration-500 border-none bg-card ring-1 ring-border/50 cursor-pointer rounded-2xl"
      onClick={() => navigate(`/carwash/${carwash.id}`)}
    >
      <CardContent className="p-0">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={carwash.photo_gallery?.[0] || carwash.photos?.[0] || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=300&fit=crop"}
            alt={carwash.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
          />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">

            {carwash.distance_text && (
              <Badge variant="secondary" className="bg-white/95 text-primary border-none shadow-sm backdrop-blur-md font-bold px-2 py-1">
                <MapPin className="w-3 h-3 mr-1" />
                {carwash.distance_text}
              </Badge>
            )}

            {carwash.search_mode === 'home' && carwash.home_service && carwash.distance_km !== undefined && carwash.delivery_radius_km !== undefined && carwash.distance_km > carwash.delivery_radius_km && (
              <Badge variant="destructive" className="bg-destructive/90 text-white border-none shadow-sm backdrop-blur-md font-bold">
                Out of Range (Home)
              </Badge>
            )}

            {carwash.search_mode === 'home' && !carwash.home_service && (
              <Badge variant="outline" className="bg-orange-500 text-white border-none shadow-sm backdrop-blur-md font-bold">
                Station Only
              </Badge>
            )}

            {carwash.search_mode === 'home' && carwash.home_service && carwash.distance_km !== undefined && carwash.delivery_radius_km !== undefined && carwash.distance_km <= carwash.delivery_radius_km && (
              <Badge className="bg-accent text-white border-none shadow-sm backdrop-blur-md font-bold">
                Mobile Service
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-sm backdrop-blur-md z-10 transition-all hover:scale-110"
            onClick={toggleFavorite}
          >
            <Heart className={`h-4.5 w-4.5 transition-all ${isFav ? "fill-red-500 text-red-500 scale-110" : "text-gray-600"}`} />
          </Button>

          {/* Price Overlay or Bottom Info */}
          <div className="absolute bottom-3 right-3">
            <div className="bg-white/95 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md border border-white/20">
              <p className="text-sm font-black text-primary">
                ₦{(carwash.base_price || 5000).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5 min-w-0">
              <h3 className="font-extrabold text-foreground text-lg tracking-tight truncate pr-2 group-hover:text-primary transition-colors">
                {carwash.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary/60" />
                <span className="truncate">{carwash.address}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-primary font-bold bg-primary/10 w-fit px-2 py-0.5 rounded-full">
                <ClockIcon className="h-3 w-3 flex-shrink-0" />
                <span>Est. Wait: 15-25 mins</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-yellow-400/10 px-2 py-0.5 rounded-full text-yellow-700 border border-yellow-400/20">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500 mr-1" />
                <span className="text-xs font-black">{carwash.rating || "0.0"}</span>
              </div>
              {carwash.review_count !== undefined && (
                <span className="text-[11px] text-muted-foreground font-bold tracking-tight">
                  {carwash.review_count} reviews
                </span>
              )}
            </div>

            <Button
              size="sm"
              className="h-9 px-5 rounded-full bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
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
