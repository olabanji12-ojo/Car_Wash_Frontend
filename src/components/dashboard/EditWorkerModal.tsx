import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Worker } from "@/Contexts/WorkerService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditWorkerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (workerId: string, data: Partial<Worker>) => Promise<void>;
    worker: Worker | null;
}

export const EditWorkerModal = ({
    isOpen,
    onClose,
    onUpdate,
    worker,
}: EditWorkerModalProps) => {
    const [formData, setFormData] = useState<Partial<Worker>>({
        name: "",
        phone: "",
        job_role: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (worker) {
            setFormData({
                name: worker.name,
                phone: worker.phone,
                job_role: worker.job_role,
            });
        }
    }, [worker]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!worker) return;

        setIsSubmitting(true);
        try {
            await onUpdate(worker.id, formData);
            onClose();
        } catch (error) {
            console.error("Failed to update worker:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Worker Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Full Name</Label>
                        <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone Number</Label>
                        <Input
                            id="edit-phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-role">Job Role</Label>
                        <Select
                            value={formData.job_role}
                            onValueChange={(value) => setFormData({ ...formData, job_role: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Washer">Washer</SelectItem>
                                <SelectItem value="Detailer">Detailer</SelectItem>
                                <SelectItem value="Supervisor">Supervisor</SelectItem>
                                <SelectItem value="Manager">Manager</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
