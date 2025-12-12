import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Carwash } from "@/Contexts/CarwashService";
import { toast } from "sonner";

interface FavoritesContextType {
    favorites: Carwash[];
    addFavorite: (carwash: Carwash) => void;
    removeFavorite: (carwashId: string) => void;
    isFavorite: (carwashId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
    const [favorites, setFavorites] = useState<Carwash[]>([]);

    // Load from local storage on mount
    useEffect(() => {
        const storedFavorites = localStorage.getItem("user_favorites");
        if (storedFavorites) {
            try {
                setFavorites(JSON.parse(storedFavorites));
            } catch (e) {
                console.error("Failed to parse favorites", e);
            }
        }
    }, []);

    // Sync to local storage whenever favorites change
    useEffect(() => {
        localStorage.setItem("user_favorites", JSON.stringify(favorites));
    }, [favorites]);

    const addFavorite = (carwash: Carwash) => {
        if (!favorites.find((f) => f.id === carwash.id)) {
            setFavorites([...favorites, carwash]);
            toast.success("Added to favorites");
        }
    };

    const removeFavorite = (carwashId: string) => {
        setFavorites(favorites.filter((f) => f.id !== carwashId));
        toast.success("Removed from favorites");
    };

    const isFavorite = (carwashId: string) => {
        return favorites.some((f) => f.id === carwashId);
    };

    return (
        <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error("useFavorites must be used within a FavoritesProvider");
    }
    return context;
};
