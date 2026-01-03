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
            <div className="container mx-auto px-4 py-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Reviews Management</h1>
                        <p className="text-muted-foreground mt-1">Monitor and respond to customer feedback</p>
                    </div>
                    <div className="flex gap-4">
                        <Card className="w-32"><CardContent className="p-4 flex flex-col items-center justify-center"><span className="text-2xl font-bold flex items-center gap-1">{stats.average} <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /></span><span className="text-xs text-muted-foreground">Avg Rating</span></CardContent></Card>
                        <Card className="w-32"><CardContent className="p-4 flex flex-col items-center justify-center"><span className="text-2xl font-bold">{stats.total}</span><span className="text-xs text-muted-foreground">Total Reviews</span></CardContent></Card>
                        <Card className="w-32"><CardContent className="p-4 flex flex-col items-center justify-center"><span className="text-2xl font-bold text-orange-500">{stats.unreplied}</span><span className="text-xs text-muted-foreground">Unreplied</span></CardContent></Card>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Filter by:</span>
                    <div className="flex gap-2">
                        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All Reviews</Button>
                        <Button variant={filter === "unreplied" ? "default" : "outline"} size="sm" onClick={() => setFilter("unreplied")}>Unreplied</Button>
                        <Button variant={filter === "5-star" ? "default" : "outline"} size="sm" onClick={() => setFilter("5-star")}>5 Stars</Button>
                        <Button variant={filter === "critical" ? "default" : "outline"} size="sm" onClick={() => setFilter("critical")}>Critical (1-3)</Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredReviews.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">No reviews found matching your filter.</div>
                    ) : (
                        filteredReviews.map((review) => (
                            <Card key={review.id} className="overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                                                <div>
                                                    <h3 className="font-semibold">{review.customer_name || "Customer"}</h3>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span className="flex items-center">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />))}</span>
                                                        <span>•</span><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(review.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {!review.response && !replyingTo && (<Button variant="outline" size="sm" onClick={() => setReplyingTo(review.id)}><MessageSquare className="h-4 w-4 mr-2" />Reply</Button>)}
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                        {review.response ? (
                                            <div className="bg-muted/50 p-4 rounded-lg border ml-8 mt-2">
                                                <div className="flex items-center gap-2 mb-2"><Badge variant="outline" className="bg-white">Business Response</Badge><span className="text-xs text-muted-foreground">{review.response_date ? formatDate(review.response_date) : "Recently"}</span></div>
                                                <p className="text-sm text-gray-600">{review.response}</p>
                                            </div>
                                        ) : replyingTo === review.id && (
                                            <div className="ml-8 mt-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <Textarea placeholder="Write a professional response to this customer..." value={replyText} onChange={(e) => setReplyText(e.target.value)} className="min-h-[100px]" />
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
