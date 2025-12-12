import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Heart } from "lucide-react";
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
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-48 h-48 md:h-auto relative">
            <img
              src={carwash.photo_gallery?.[0] || "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&h=300&fit=crop"}
              alt={carwash.name}
              className="w-full h-full object-cover"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/20 hover:bg-black/40 text-white rounded-full md:hidden"
              onClick={toggleFavorite}
            >
              <Heart className={`h-5 w-5 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>

          <div className="flex-1 p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div>
                  <h3 className="font-semibold text-lg">{carwash.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{carwash.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{carwash.rating || "0.0"}</span>
                    {carwash.review_count !== undefined && (
                      <span className="text-sm text-muted-foreground">
                        ({carwash.review_count} review{carwash.review_count !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>

                  <Badge variant={carwash.is_active ? "default" : "secondary"}>
                    {carwash.is_active ? "Open Now" : "Closed"}
                  </Badge>
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-2">
                <div className="text-2xl font-bold">
                  {carwash.services?.[0]?.price ? `₦${carwash.services[0].price.toLocaleString()}` : "N/A"}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="hidden md:flex"
                    onClick={toggleFavorite}
                  >
                    <Heart className={`h-4 w-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/carwash/${carwash.id}`)}
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
