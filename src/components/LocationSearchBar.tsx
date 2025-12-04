import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface LocationSearchBarProps {
    onPlaceSelected: (lat: number, lng: number, address: string) => void;
    placeholder?: string;
    className?: string;
}

interface MapboxFeature {
    place_name: string;
    center: [number, number]; // [lng, lat]
}

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
    onPlaceSelected,
    placeholder = "Search location...",
    className
}) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

    const searchLocation = async (searchText: string) => {
        if (!searchText || searchText.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json?access_token=${MAPBOX_TOKEN}&country=NG&limit=5`
            );
            const data = await response.json();
            setSuggestions(data.features || []);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Mapbox geocoding error:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        searchLocation(value);
    };

    const handleSelectSuggestion = (feature: MapboxFeature) => {
        const [lng, lat] = feature.center;
        const address = feature.place_name;

        setQuery(address);
        setSuggestions([]);
        setShowSuggestions(false);
        onPlaceSelected(lat, lng, address);
    };

    return (
        <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
            {isLoading && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 text-muted-foreground animate-spin z-10" />
            )}
            <Input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder={placeholder}
                className={`pl-10 ${className}`}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((feature, index) => (
                        <div
                            key={index}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleSelectSuggestion(feature)}
                        >
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{feature.place_name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
