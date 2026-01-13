import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare, Filter, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
            <div className="w-full px-3 sm:px-6 py-4 sm:py-8 space-y-8 font-outfit">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div className="w-full xl:w-auto">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">Reviews Management</h1>
                        <p className="text-sm md:text-lg text-muted-foreground mt-1 font-medium italic">Your direct line to customer happiness</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 w-full lg:max-w-2xl">
                        <Card className="shadow-card ring-1 ring-border/5 border-none bg-primary/5">
                            <CardContent className="p-3 sm:p-5 flex flex-col items-center justify-center text-center">
                                <span className="text-lg sm:text-3xl font-black flex items-center gap-1 text-primary">
                                    {stats.average}
                                    <Star className="h-4 w-4 sm:h-6 sm:w-6 fill-yellow-400 text-yellow-400" />
                                </span>
                                <span className="text-[9px] sm:text-[11px] text-primary/70 uppercase tracking-widest font-black mt-1">Avg Rating</span>
                            </CardContent>
                        </Card>
                        <Card className="shadow-card ring-1 ring-border/5 border-none bg-accent/5">
                            <CardContent className="p-3 sm:p-5 flex flex-col items-center justify-center text-center">
                                <span className="text-lg sm:text-3xl font-black text-accent">{stats.total}</span>
                                <span className="text-[9px] sm:text-[11px] text-accent/70 uppercase tracking-widest font-black mt-1">Total Feed</span>
                            </CardContent>
                        </Card>
                        <Card className="shadow-card ring-1 ring-border/5 border-none bg-orange-50">
                            <CardContent className="p-3 sm:p-5 flex flex-col items-center justify-center text-center">
                                <span className="text-lg sm:text-3xl font-black text-orange-600">{stats.unreplied}</span>
                                <span className="text-[9px] sm:text-[11px] text-orange-600/70 uppercase tracking-widest font-black mt-1">New Action</span>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex flex-col gap-4 bg-card rounded-2xl border border-border/50 shadow-sm p-4 w-full overflow-hidden">
                    <div className="flex items-center gap-2.5 px-1 border-b border-border/50 pb-3">
                        <Filter className="h-4 w-4 text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-primary/80">Search Filters</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 px-1 w-full no-scrollbar touch-pan-x">
                        <Button
                            variant={filter === "all" ? "default" : "outline"}
                            size="sm"
                            className={cn("whitespace-nowrap flex-shrink-0 rounded-full h-10 px-6 font-bold transition-all", filter === "all" ? "shadow-lg shadow-primary/20" : "")}
                            onClick={() => setFilter("all")}
                        >
                            All Reviews
                        </Button>
                        <Button
                            variant={filter === "unreplied" ? "default" : "outline"}
                            size="sm"
                            className={cn("whitespace-nowrap flex-shrink-0 rounded-full h-10 px-6 font-bold transition-all", filter === "unreplied" ? "shadow-lg shadow-orange/20" : "")}
                            onClick={() => setFilter("unreplied")}
                        >
                            Pending Reply
                        </Button>
                        <Button
                            variant={filter === "5-star" ? "default" : "outline"}
                            size="sm"
                            className={cn("whitespace-nowrap flex-shrink-0 rounded-full h-10 px-6 font-bold transition-all", filter === "5-star" ? "shadow-lg shadow-yellow/20" : "")}
                            onClick={() => setFilter("5-star")}
                        >
                            5 Star Love
                        </Button>
                        <Button
                            variant={filter === "critical" ? "default" : "outline"}
                            size="sm"
                            className={cn("whitespace-nowrap flex-shrink-0 rounded-full h-10 px-6 font-bold transition-all", filter === "critical" ? "shadow-lg shadow-destructive/20" : "")}
                            onClick={() => setFilter("critical")}
                        >
                            Critical Growth
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    {filteredReviews.length === 0 ? (
                        <div className="text-center py-24 text-muted-foreground bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/50">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                            <p className="font-bold text-lg">No reviews match your filter.</p>
                            <p className="text-sm">Try exploring a wider selection!</p>
                        </div>
                    ) : (
                        filteredReviews.map((review) => (
                            <Card key={review.id} className="overflow-hidden border-none rounded-[1.5rem] shadow-card ring-1 ring-border/5">
                                <CardContent className="p-5 sm:p-8">
                                    <div className="flex flex-col gap-5">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                            <div className="flex gap-4">
                                                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex-shrink-0 flex items-center justify-center border border-primary/20">
                                                    <User className="h-7 w-7 text-primary" />
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <h3 className="font-black text-lg sm:text-xl truncate text-foreground">{review.customer_name || "Valued Customer"}</h3>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                        <div className="flex items-center bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-500" : "text-gray-200"}`} />
                                                            ))}
                                                        </div>
                                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold italic">
                                                            <Calendar className="h-3.5 w-3.5 text-primary/60" />
                                                            {formatDate(review.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {!review.response && !replyingTo && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full sm:w-auto rounded-full h-10 px-6 font-black border-2 hover:bg-primary hover:text-white transition-all shadow-sm"
                                                    onClick={() => setReplyingTo(review.id)}
                                                >
                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                    REPLY NOW
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-foreground/80 leading-relaxed text-base sm:text-lg font-medium italic pl-1 border-l-4 border-primary/10">"{review.comment}"</p>

                                        {review.response ? (
                                            <div className="bg-primary/5 p-4 sm:p-6 rounded-[1.25rem] border border-primary/10 ml-0 sm:ml-12 mt-2 relative">
                                                <div className="absolute top-0 left-0 w-2 h-full bg-primary/20 rounded-l-full" />
                                                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                                                    <Badge className="bg-primary text-[10px] sm:text-xs font-black tracking-widest px-2.5 py-1">YOU RESPONDED</Badge>
                                                    <span className="text-[10px] sm:text-xs text-primary/60 font-black italic">{review.response_date ? formatDate(review.response_date) : "Recently"}</span>
                                                </div>
                                                <p className="text-sm sm:text-base text-foreground/70 leading-relaxed font-semibold">{review.response}</p>
                                            </div>
                                        ) : replyingTo === review.id && (
                                            <div className="ml-0 sm:ml-12 mt-2 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                                <div className="relative">
                                                    <Textarea
                                                        placeholder="Craft a thoughtful response here..."
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        className="min-h-[120px] text-base rounded-[1.25rem] border-2 border-primary/20 focus-visible:ring-primary p-4 shadow-inner"
                                                    />
                                                </div>
                                                <div className="flex gap-3 justify-end">
                                                    <Button variant="ghost" size="sm" className="rounded-full font-bold h-10 px-6" onClick={() => { setReplyingTo(null); setReplyText(""); }}>Cancel</Button>
                                                    <Button size="sm" className="rounded-full shadow-lg shadow-primary/20 font-black h-10 px-8" onClick={() => handleReplySubmit(review.id)}>POST RESPONSE</Button>
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
