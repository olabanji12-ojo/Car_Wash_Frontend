import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import WorkerService from "@/Contexts/WorkerService";

interface AddWorkerModalProps {
    isOpen: boolean;
    onClose: () => void;
    carwashId: string;
    onSuccess: () => void;
}

export const AddWorkerModal = ({ isOpen, onClose, carwashId, onSuccess }: AddWorkerModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        job_role: "Washer",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsLoading(true);
        console.log("📤 Sending worker data:", { ...formData, carwash_id: carwashId, role: "worker" });
        try {
            const result = await WorkerService.createWorker({
                ...formData,
                carwash_id: carwashId,
                role: "worker",
            });
            console.log("✅ Worker added result:", result);
            toast.success("Worker added successfully");
            onSuccess();
            onClose();
            setFormData({ name: "", email: "", phone: "", job_role: "Washer" });
        } catch (error: any) {
            console.error("❌ Failed to add worker:", error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to add worker. Please try again.";
            console.error("❌ Backend error details:", error.response?.data);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Worker</DialogTitle>
                        <DialogDescription>
                            Enter the details of your new staff member. They will be able to log in with their email.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+234..."
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Job Role</Label>
                            <select
                                id="role"
                                value={formData.job_role}
                                onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="Washer">Washer</option>
                                <option value="Detailer">Detailer</option>
                                <option value="Supervisor">Supervisor</option>
                                <option value="Manager">Manager</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                            {isLoading ? "Adding..." : "Add Worker"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
