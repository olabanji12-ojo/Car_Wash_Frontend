import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { toast } from "sonner";
import ReviewService from "@/Contexts/ReviewService";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    carwashId: string;
    orderId?: string;
    onSuccess?: () => void;
}

export const ReviewModal = ({ isOpen, onClose, carwashId, orderId, onSuccess }: ReviewModalProps) => {
    const [rating, setRating] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [cleanliness, setCleanliness] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0 || accuracy === 0 || cleanliness === 0) {
            toast.error("Please provide ratings for all categories");
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
                order_id: orderId,
                rating,
                accuracy,
                cleanliness,
                comment
            });

            onSuccess?.();
            onClose();
            // Reset form
            setRating(0);
            setAccuracy(0);
            setCleanliness(0);
            setComment("");
        } catch (error) {
            // Error handled in service
        } finally {
            setIsSubmitting(false);
        }
    };

    const StarRating = ({ value, onChange, label }: { value: number, onChange: (v: number) => void, label: string }) => (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="focus:outline-none"
                    >
                        <Star
                            className={`h-6 w-6 ${star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rate your experience</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <StarRating value={rating} onChange={setRating} label="Overall Rating" />
                    <StarRating value={accuracy} onChange={setAccuracy} label="Service Accuracy" />
                    <StarRating value={cleanliness} onChange={setCleanliness} label="Cleanliness" />

                    <div className="space-y-2">
                        <Label htmlFor="comment">Comment</Label>
                        <Textarea
                            id="comment"
                            placeholder="Tell us about your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
