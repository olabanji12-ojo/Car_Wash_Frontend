import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarwashCard } from "./CarwashCard";
import { CarwashMap } from "./CarwashMap";
import { MapPin } from "lucide-react";
import CarwashService, { Carwash } from "@/Contexts/CarwashService";

interface CarwashListProps {
  carwashes: Carwash[];
  loading: boolean;
}

export const CarwashList = ({ carwashes, loading }: CarwashListProps) => {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Carwashes Near You</h2>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <MapPin className="h-4 w-4" />
            <span>Lagos, Alimosho</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <CarwashMap />

        <div className="space-y-4">
          {loading ? (
            <p>Loading carwashes...</p>
          ) : carwashes.length > 0 ? (
            carwashes.map((carwash) => (
              <CarwashCard key={carwash.id} carwash={carwash} />
            ))
          ) : (
            <p>No carwashes found nearby.</p>
          )}
        </div>
      </div>
    </div>
  );
};
