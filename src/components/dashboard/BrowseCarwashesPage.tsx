import { useState, useEffect } from "react";
// FIX: Import the default export (CarwashService) and the necessary types
import CarwashService, { Carwash, PaginatedCarwashes } from "@/Contexts/CarwashService";
import { CarwashCard } from "./CarwashCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 6;

/**
 * A dedicated page component to browse all carwashes with server-side pagination.
 * It manages its own state for data fetching, loading, and pagination.
 */
export const BrowseCarwashesPage = () => {
    // State for the list of carwashes on the current page
    const [carwashes, setCarwashes] = useState<Carwash[]>([]);
    // State for loading status
    const [loading, setLoading] = useState(true);
    // State for the current page number (1-indexed)
    const [currentPage, setCurrentPage] = useState(1);
    // State for the total number of carwashes available from the server
    const [totalItems, setTotalItems] = useState(0);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    // Effect to fetch carwashes whenever the currentPage changes
    useEffect(() => {
        const fetchCarwashes = async () => {
            setLoading(true);
            try {
                // FIX: Call the method on the default imported object (CarwashService)
                const response: PaginatedCarwashes = await CarwashService.getAllCarwashes(
                    currentPage,
                    ITEMS_PER_PAGE
                );
                
                // Use the structured response data
                setCarwashes(response.data);
                setTotalItems(response.totalCount);
            } catch (error) {
                console.error("Failed to fetch carwashes:", error);
                // In case of an error, reset the state
                setCarwashes([]);
                setTotalItems(0);
            } finally {
                setLoading(false);
            }
        };

        fetchCarwashes();
    }, [currentPage]);

    // Handlers for pagination
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">All Carwashes</h2>

            {/* Grid for Carwash Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    // Skeleton loading state
                    Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                        <div key={i} className="space-y-3 p-4 border rounded-lg bg-card/50">
                            <Skeleton className="h-32 w-full rounded-md" />
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ))
                ) : carwashes.length > 0 ? (
                    // Render carwash cards
                    carwashes.map((carwash) => (
                        <CarwashCard key={carwash.id} carwash={carwash} />
                    ))
                ) : null}
            </div>

            {/* Empty State */}
            {!loading && carwashes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-lg bg-muted/30 col-span-full">
                    <div className="bg-muted rounded-full p-4 mb-4">
                        <SearchX className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No carwashes found</h3>
                    <p className="text-muted-foreground max-w-sm">
                        We couldn't find any carwashes. Please try again later.
                    </p>
                    <Button variant="outline" onClick={() => setCurrentPage(1)}>
                        Refresh List
                    </Button>
                </div>
            )}

            {/* Pagination Controls */}
            {totalItems > 0 && totalPages > 1 && (
                <div className="flex items-center justify-center pt-4 space-x-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="gap-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                    </Button>

                    <span className="text-sm font-medium text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="gap-1"
                    >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default BrowseCarwashesPage;