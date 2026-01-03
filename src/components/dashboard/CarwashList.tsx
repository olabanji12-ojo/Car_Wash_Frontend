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
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 w-full">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 leading-tight">Recommended for You</h2>
                    <div className="flex items-center gap-2 text-sm font-medium overflow-hidden">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-full max-w-full">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">
                                {searchedAddress || (hasSearched ? "Searched Location" : "Lagos, Alimosho")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm ring-1 ring-gray-200/50">
                    <CarwashMap
                        carwashes={carwashes}
                        center={searchedLocation}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                    {loading ? (
                        // Skeleton Loading State
                        Array.from({ length: DISPLAY_LIMIT }).map((_, i) => (
                            <div key={i} className="space-y-3 p-4 border rounded-lg bg-card/50">
                                <Skeleton className="h-32 w-full rounded-md" />
                                <Skeleton className="h-5 w-3/4" />
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
                        <div className="flex justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsExpanded(true)}
                                className="gap-2 w-full sm:w-auto"
                            >
                                View More Carwashes ({carwashes.length - DISPLAY_LIMIT} found)
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )
                ) : !loading && (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-gray-100 shadow-sm ring-1 ring-gray-200/50">
                        <div className="bg-indigo-50 rounded-full p-6 mb-6">
                            <SearchX className="h-10 w-10 text-indigo-600" />
                        </div>
                        {hasSearched ? (
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">No carwashes found nearby</h3>
                                <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
                                    We couldn't find any carwashes in this specific area. Try expanding your search or selecting a different location.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className="mt-4 rounded-full"
                                >
                                    Modify Search
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">Discover Carwashes</h3>
                                <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
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