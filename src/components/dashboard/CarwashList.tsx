import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CarwashCard } from "./CarwashCard";
import { CarwashMap } from "./CarwashMap";
import { MapPin, SearchX, ArrowRight } from "lucide-react";
import { Carwash } from "@/Contexts/CarwashService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface CarwashListProps {
    carwashes: Carwash[];
    loading: boolean;
    hasSearched: boolean;
    searchedAddress?: string;
    searchedLocation?: [number, number]; // [lng, lat]
}

// Internal display configuration
const DISPLAY_LIMIT = 6;

export const CarwashList = ({
    carwashes,
    loading,
    hasSearched,
    searchedAddress,
    searchedLocation
}: CarwashListProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Logic for limited display
    const displayCarwashes = isExpanded ? carwashes : carwashes.slice(0, DISPLAY_LIMIT);
    const hasMoreCarwashes = carwashes.length > DISPLAY_LIMIT;

    return (
        <div className="space-y-10 pb-20 px-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2 w-full">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">Recommended for You</h2>
                    <div className="flex items-center gap-2 text-sm font-semibold overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary rounded-full max-w-full border border-primary/10">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                                {searchedAddress || (hasSearched ? "Searched Location" : "Lagos, Alimosho")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-10">
                <div className="rounded-[2rem] overflow-hidden border border-border/50 shadow-card ring-1 ring-border/5">
                    <CarwashMap
                        carwashes={carwashes}
                        center={searchedLocation}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-10">
                    {loading ? (
                        // Skeleton Loading State
                        Array.from({ length: DISPLAY_LIMIT }).map((_, i) => (
                            <div key={i} className="space-y-4 p-5 border rounded-2xl bg-card/40 animate-pulse">
                                <Skeleton className="h-48 w-full rounded-xl" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))
                    ) : carwashes.length > 0 ? (
                        <>
                            {/* Render the limited subset of carwashes */}
                            {displayCarwashes.map((carwash) => (
                                <CarwashCard key={carwash.id} carwash={carwash} />
                            ))}
                        </>
                    ) : null}
                </div>

                {/* View More Button / Empty State Logic */}
                {carwashes.length > 0 ? (
                    hasMoreCarwashes && !isExpanded && (
                        <div className="flex justify-center pt-8">
                            <Button
                                variant="outline"
                                onClick={() => setIsExpanded(true)}
                                className="gap-2 w-full sm:w-auto h-12 rounded-full font-bold border-2 hover:bg-primary hover:text-white transition-all"
                            >
                                View More Carwashes ({carwashes.length - DISPLAY_LIMIT} more)
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )
                ) : !loading && (
                    <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-card rounded-[2.5rem] border border-border shadow-card ring-1 ring-border/5">
                        <div className="bg-primary/5 rounded-full p-8 mb-8 border border-primary/10">
                            <SearchX className="h-12 w-12 text-primary" />
                        </div>
                        {hasSearched ? (
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-foreground">No carwashes found nearby</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto text-base leading-relaxed font-medium">
                                    We couldn't find any carwashes in this specific area. Try expanding your search or selecting a different location.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className="mt-6 rounded-full h-12 px-8 font-bold"
                                >
                                    Modify Search
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-foreground">Discover Carwashes</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto text-base leading-relaxed font-medium">
                                    Use the search bar above to see the best carwashes in your neighborhood.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};