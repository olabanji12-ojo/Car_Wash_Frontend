import { CarwashCard } from "@/components/dashboard/CarwashCard";
import { useFavorites } from "@/Contexts/FavoritesContext";
import { Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Favorites = () => {
    const { favorites } = useFavorites();
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">My Favorites</h2>
                    <p className="text-muted-foreground mt-1">
                        Your saved carwashes for quick access
                    </p>
                </div>
            </div>

            {favorites.length > 0 ? (
                <div className="grid gap-6">
                    {favorites.map((carwash) => (
                        <CarwashCard key={carwash.id} carwash={carwash} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <Heart className="h-8 w-8 text-muted-foreground fill-none" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                        Save carwashes you like to find them easily later.
                    </p>
                    <Button onClick={() => navigate("/dashboard")} className="gap-2">
                        <Search className="h-4 w-4" />
                        Find Carwashes
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Favorites;
