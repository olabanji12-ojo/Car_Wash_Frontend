import { Card } from "@/components/ui/card";
import { CarwashCard } from "./CarwashCard";
import { CarwashMap } from "./CarwashMap";
import { MapPin, SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { Carwash } from "@/Contexts/CarwashService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface CarwashListProps {
  carwashes: Carwash[];
  loading: boolean;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const CarwashList = ({
  carwashes,
  loading,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange
}: CarwashListProps) => {

  // Calculate total pages based on total items and items per page
  // We use the totalItems count returned by the API here.
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // --- FIX: REMOVED CLIENT-SIDE SLICING LOGIC ---
  // const startIndex = (currentPage - 1) * itemsPerPage;
  // const endIndex = startIndex + itemsPerPage;
  // const paginatedCarwashes = carwashes.slice(startIndex, endIndex);
  
  // The `carwashes` prop now directly contains the items for the current page.

  // Handler for page change clicks
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

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

        <div className="space-y-4">
          {loading ? (
            // Skeleton Loading State
            Array.from({ length: 5 }).map((_, i) => ( 
              <div key={i} className="flex gap-4 p-4 border rounded-lg bg-card/50">
                <Skeleton className="h-24 w-24 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="pt-2 flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
              </div>
              </div>
            ))
          ) : carwashes.length > 0 ? (
            <>
              {/* RENDER THE ARRAY DIRECTLY */}
              {carwashes.map((carwash) => (
                <CarwashCard key={carwash.id} carwash={carwash} />
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-6">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <span className="text-sm font-medium text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
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
    </div>
  );
};