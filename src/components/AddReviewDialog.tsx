import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import ReviewService from "@/Contexts/ReviewService";
import { toast } from "sonner";

interface AddReviewDialogProps {
    carwashId: string;
    onReviewAdded: () => void;
}

export function AddReviewDialog({ carwashId, onReviewAdded }: AddReviewDialogProps) {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }
        if (!comment.trim()) {
            toast.error("Please write a comment");
            return;
        }

        try {
            setIsSubmitting(true);
            await ReviewService.createReview({
                carwash_id: carwashId,
                rating: rating,
                accuracy: rating, // Defaulting these for now as simple UI only has one star rating
                cleanliness: rating,
                comment: comment,
            });

            setOpen(false);
            setRating(0);
            setComment("");
            onReviewAdded();
        } catch (error) {
            // Error handled in service
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Write a Review</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>
                        Share your experience with this carwash.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <Label>Rating</Label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="focus:outline-none transition-transform hover:scale-110"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`h-8 w-8 ${star <= (hoverRating || rating)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-muted-foreground/30"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="comment">Comment</Label>
                        <Textarea
                            id="comment"
                            placeholder="Tell us about your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
