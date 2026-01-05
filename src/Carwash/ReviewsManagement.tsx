import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare, Filter, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useReviews } from "@/hooks/useBookings";
import { useQueryClient } from "@tanstack/react-query";

interface Review {
    id: string;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
    response?: string;
    response_date?: string;
    customer_name?: string;
}

const ReviewsManagement = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState("all");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");

    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    // Use React Query Hook
    const { data: fetchedReviews = [], isLoading } = useReviews(user?.carwash_id);

    const reviews = Array.isArray(fetchedReviews) ? fetchedReviews : [];

    // Calculate stats from reviews
    const total = reviews.length;
    const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
    const average = total > 0 ? (sum / total).toFixed(1) : 0;
    const unreplied = reviews.filter((r: any) => !r.response).length;

    const stats = {
        average: Number(average),
        total,
        unreplied
    };

    const handleReplySubmit = async (reviewId: string) => {
        if (!replyText.trim()) {
            toast.error("Reply cannot be empty");
            return;
        }

        try {
            const { default: ReviewService } = await import('@/Contexts/ReviewService');
            await ReviewService.replyToReview(reviewId, replyText);

            // Invalidate query to refresh
            queryClient.invalidateQueries({ queryKey: ["reviews", user?.carwash_id] });

            setReplyingTo(null);
            setReplyText("");
        } catch (error) {
            console.error("Failed to reply:", error);
        }
    };

    const filteredReviews = reviews.filter(review => {
        if (filter === "unreplied") return !review.response;
        if (filter === "5-star") return review.rating === 5;
        if (filter === "critical") return review.rating <= 3;
        return true;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="w-full px-2 sm:px-4 py-4 sm:py-8 space-y-6">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div className="w-full xl:w-auto">
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight">Reviews Management</h1>
                        <p className="text-xs md:text-base text-muted-foreground mt-0.5 md:mt-1">Feedback from your customers</p>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full lg:max-w-xl">
                        <Card className="shadow-none border-muted/50 bg-muted/5">
                            <CardContent className="p-2 sm:p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-sm sm:text-2xl font-bold flex items-center gap-0.5 sm:gap-1">
                                    {stats.average}
                                    <Star className="h-3 w-3 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />
                                </span>
                                <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Rating</span>
                            </CardContent>
                        </Card>
                        <Card className="shadow-none border-muted/50 bg-muted/5">
                            <CardContent className="p-2 sm:p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-sm sm:text-2xl font-bold">{stats.total}</span>
                                <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total</span>
                            </CardContent>
                        </Card>
                        <Card className="shadow-none border-muted/50 bg-muted/5">
                            <CardContent className="p-2 sm:p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-sm sm:text-2xl font-bold text-orange-500">{stats.unreplied}</span>
                                <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-semibold">New</span>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex flex-col gap-3 bg-card p-3 rounded-lg border shadow-sm w-full overflow-visible">
                    <div className="flex items-center gap-2 flex-shrink-0 px-1">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Filter Reviews</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 px-1 w-full -mx-1 no-scrollbar touch-pan-x">
                        <Button variant={filter === "all" ? "default" : "outline"} size="sm" className="whitespace-nowrap flex-shrink-0" onClick={() => setFilter("all")}>All Reviews</Button>
                        <Button variant={filter === "unreplied" ? "default" : "outline"} size="sm" className="whitespace-nowrap flex-shrink-0" onClick={() => setFilter("unreplied")}>Unreplied</Button>
                        <Button variant={filter === "5-star" ? "default" : "outline"} size="sm" className="whitespace-nowrap flex-shrink-0" onClick={() => setFilter("5-star")}>5 Stars</Button>
                        <Button variant={filter === "critical" ? "default" : "outline"} size="sm" className="whitespace-nowrap flex-shrink-0" onClick={() => setFilter("critical")}>Critical (1-3)</Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredReviews.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">No reviews found matching your filter.</div>
                    ) : (
                        filteredReviews.map((review) => (
                            <Card key={review.id} className="overflow-hidden">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div className="flex gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold truncate">{review.customer_name || "Customer"}</h3>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                                                        <span className="flex items-center">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                                                            ))}
                                                        </span>
                                                        <span className="hidden xs:inline">•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(review.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {!review.response && !replyingTo && (
                                                <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setReplyingTo(review.id)}>
                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                    Reply
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                        {review.response ? (
                                            <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border ml-4 sm:ml-8 mt-1">
                                                <div className="flex items-center flex-wrap gap-2 mb-2">
                                                    <Badge variant="outline" className="bg-white text-[10px] sm:text-xs">Business Response</Badge>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground">{review.response_date ? formatDate(review.response_date) : "Recently"}</span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{review.response}</p>
                                            </div>
                                        ) : replyingTo === review.id && (
                                            <div className="ml-4 sm:ml-8 mt-1 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <Textarea
                                                    placeholder="Write a professional response..."
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    className="min-h-[100px] text-sm"
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setReplyText(""); }}>Cancel</Button>
                                                    <Button size="sm" onClick={() => handleReplySubmit(review.id)}>Post Response</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ReviewsManagement;
