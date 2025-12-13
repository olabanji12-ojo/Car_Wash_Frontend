import { Card } from "@/components/ui/card";
import { CarwashCard } from "./CarwashCard";
import { CarwashMap } from "./CarwashMap";
import { MapPin, SearchX, ArrowRight } from "lucide-react"; // Changed Chevron icons to ArrowRight
import { Carwash } from "@/Contexts/CarwashService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface CarwashListProps {
  carwashes: Carwash[];
  loading: boolean;
  // ADDED PROP: Handler for the "View More" action
  onViewAll: () => void;
  
  // REMOVED PAGINATION PROPS: currentPage, itemsPerPage, totalItems, onPageChange
}

// Internal display configuration
const DISPLAY_LIMIT = 6; 

export const CarwashList = ({
  carwashes,
  loading,
  onViewAll
}: CarwashListProps) => {

  // Logic for limited display
  const initialDisplayCarwashes = carwashes.slice(0, DISPLAY_LIMIT);
  const hasMoreCarwashes = carwashes.length > DISPLAY_LIMIT;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Carwashes Near You</h2>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">Lagos, Alimosho</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <CarwashMap />

        {/*
          NEW: Responsive Grid Layout
          - grid-cols-2: 2 columns by default (small devices)
          - lg:grid-cols-3: 3 columns on large screens
          - gap-4: Spacing between items
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            // Skeleton Loading State (Show skeletons matching the grid)
            Array.from({ length: DISPLAY_LIMIT }).map((_, i) => (
              // Adjusted skeleton styling for a card-like grid item
              <div key={i} className="space-y-3 p-4 border rounded-lg bg-card/50">
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : carwashes.length > 0 ? (
            <>
              {/* Render the limited subset of carwashes */}
              {initialDisplayCarwashes.map((carwash) => (
                <CarwashCard key={carwash.id} carwash={carwash} />
              ))}
            </>
          ) : null} {/* Closing the grid div here, moving the empty state out */}
        </div>
        
        {/* View More Button / Empty State Logic */}
        {carwashes.length > 0 ? (
          hasMoreCarwashes && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={onViewAll} 
                className="gap-2 w-full sm:w-auto"
              >
                View More Carwashes ({carwashes.length - DISPLAY_LIMIT} found)
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )
        ) : !loading && (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-lg bg-muted/30">
            <div className="bg-muted rounded-full p-4 mb-4">
              <SearchX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No carwashes found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              We couldn't find any carwashes in this area. Try adjusting your search or location.
            </p>
            <Button variant="outline" className="gap-2">
              Refresh List
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};