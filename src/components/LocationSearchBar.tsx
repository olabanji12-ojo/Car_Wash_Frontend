import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, XCircle, Navigation, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationSearchBarProps {
    onPlaceSelected: (lat: number, lng: number, address: string) => void;
    placeholder?: string;
    className?: string;
}

interface MapboxFeature {
    place_name: string;
    center: [number, number]; // [lng, lat]
    place_type: string[];
    text: string;
    context?: { id: string; text: string }[];
}

const RECENT_KEY = 'carwash_recent_searches';
const MAX_RECENT = 3;

const loadRecent = (): { address: string; lat: number; lng: number }[] => {
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch {
        return [];
    }
};

const saveRecent = (entry: { address: string; lat: number; lng: number }) => {
    const prev = loadRecent().filter(r => r.address !== entry.address);
    const updated = [entry, ...prev].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
};

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
    onPlaceSelected,
    placeholder = "Search location...",
    className
}) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [recentSearches, setRecentSearches] = useState(loadRecent);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const userCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

    // Try to silently get user coords on mount for proximity bias
    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            (pos) => {
                userCoordsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            },
            () => {} // Silently fail — proximity bias is optional
        );
    }, []);

    const searchLocation = useCallback(async (searchText: string) => {
        if (!searchText || searchText.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            // Use Nominatim (OpenStreetMap) for forward geocoding
            // It has much better coverage for Nigerian estates/streets than Mapbox
            // Priority-bias Nigeria but don't restrict — catches cross-border estates near borders
            const url = `https://nominatim.openstreetmap.org/search`
                + `?q=${encodeURIComponent(searchText)}`
                + `&format=json`
                + `&limit=7`
                + `&addressdetails=1`
                + `&countrycodes=ng`
                + `&accept-language=en`;

            const response = await fetch(url, {
                headers: {
                    // Nominatim policy requires a descriptive User-Agent
                    'User-Agent': 'BanjiCarwashApp/1.0 (carwash-discovery)'
                }
            });
            const data = await response.json();

            // Map Nominatim response to same shape as Mapbox features
            const mapped: MapboxFeature[] = (data || []).map((item: any) => ({
                place_name: item.display_name,
                center: [parseFloat(item.lon), parseFloat(item.lat)],
                place_type: [item.type || 'place'],
                text: item.name || item.display_name,
            }));

            setSuggestions(mapped);
            setShowDropdown(true);
        } catch (error) {
            console.error('Nominatim geocoding error:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setShowDropdown(true);

        // Debounce the API call by 300ms
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchLocation(value), 300);
    };

    const handleSelectSuggestion = (feature: MapboxFeature) => {
        const [lng, lat] = feature.center;
        const address = feature.place_name;

        setQuery(address);
        setSuggestions([]);
        setShowDropdown(false);
        onPlaceSelected(lat, lng, address);
        saveRecent({ address, lat, lng });
        setRecentSearches(loadRecent());
    };

    const handleSelectRecent = (recent: { address: string; lat: number; lng: number }) => {
        setQuery(recent.address);
        setShowDropdown(false);
        onPlaceSelected(recent.lat, recent.lng, recent.address);
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) return;

        setIsLocating(true);
        setQuery('Finding your location...');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                userCoordsRef.current = { lat: latitude, lng: longitude };
                try {
                    const response = await fetch(
                        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`
                        + `?access_token=${MAPBOX_TOKEN}`
                        + `&types=address,neighborhood,locality,place`
                        + `&language=en`
                    );
                    const data = await response.json();
                    const address = data.features?.[0]?.place_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
                    setQuery(address);
                    onPlaceSelected(latitude, longitude, address);
                    saveRecent({ address, lat: latitude, lng: longitude });
                    setRecentSearches(loadRecent());
                } catch {
                    setQuery(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                    onPlaceSelected(latitude, longitude, `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                } finally {
                    setIsLocating(false);
                }
            },
            () => {
                setIsLocating(false);
                setQuery('');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const clearSearch = () => {
        setQuery('');
        setSuggestions([]);
        setShowDropdown(false);
        onPlaceSelected(0, 0, '');
    };

    const showRecentOnly = showDropdown && query.length === 0 && recentSearches.length > 0;
    const showSuggestions = showDropdown && suggestions.length > 0;

    return (
        <div className="relative">
            {/* Loading spinner or map pin icon */}
            <MapPin className={cn(
                "absolute left-3 top-3 h-4 w-4 z-10 transition-colors",
                query ? "text-primary" : "text-muted-foreground"
            )} />

            {/* Right side icons */}
            <div className="absolute right-3 top-3 flex items-center gap-1 z-10">
                {(isLoading || isLocating) && (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                )}
                {query && !isLocating && (
                    <button type="button" onClick={clearSearch} className="text-muted-foreground hover:text-red-500 p-0.5">
                        <XCircle className="h-4 w-4" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className={cn(
                        "p-0.5 transition-colors",
                        isLocating ? "text-primary animate-pulse" : "text-muted-foreground hover:text-primary"
                    )}
                    title={isLocating ? "Finding your location..." : "Use my location"}
                >
                    <Navigation className="h-4 w-4" />
                </button>
            </div>

            {/* Input */}
            <Input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder={placeholder}
                className={cn(
                    "pl-9 sm:pl-10 pr-16 text-sm sm:text-base",
                    query && "border-primary/50 bg-primary/5",
                    className
                )}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />

            {/* Dropdown */}
            {(showRecentOnly || showSuggestions) && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-auto">

                    {/* Recent Searches */}
                    {showRecentOnly && (
                        <>
                            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Recent Searches
                            </div>
                            {recentSearches.map((recent, i) => (
                                <div
                                    key={i}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-2 border-b border-gray-100 last:border-0"
                                    onClick={() => handleSelectRecent(recent)}
                                >
                                    <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 truncate">{recent.address}</span>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Live Suggestions */}
                    {showSuggestions && suggestions.map((feature, index) => {
                        // Split place_name into main text and secondary context
                        const parts = feature.place_name.split(',');
                        const main = parts[0];
                        const sub = parts.slice(1).join(',').trim();

                        return (
                            <div
                                key={index}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                                onClick={() => handleSelectSuggestion(feature)}
                            >
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{main}</p>
                                        {sub && <p className="text-xs text-gray-500 truncate">{sub}</p>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
