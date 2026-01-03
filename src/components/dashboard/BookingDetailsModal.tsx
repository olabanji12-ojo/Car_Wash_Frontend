import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Car, MapPin, User, FileText, Smartphone, Truck, ShieldCheck, Copy, Share2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Worker } from "@/Contexts/WorkerService";
import { useState } from "react";
import { toast } from "sonner";

interface BookingDetailsModalProps {
    booking: any;
    isOpen: boolean;
    onClose: () => void;
    onAccept?: (id: string) => void;
    onReject?: (id: string) => void;
    onUpdateStatus?: (id: string, status: string) => void;
    workers?: Worker[];
    onAssignWorker?: (bookingId: string, workerId: string) => Promise<void>;
}

export const BookingDetailsModal = ({
    booking,
    isOpen,
    onClose,
    onAccept,
    onReject,
    onUpdateStatus,
    workers = [],
    onAssignWorker
}: BookingDetailsModalProps) => {
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignedWorkerId, setAssignedWorkerId] = useState<string>(booking?.worker_id || "");

    const handleCopyTrackingLink = () => {
        const link = `${window.location.origin}/track/${booking.id}`;
        navigator.clipboard.writeText(link);
        toast.success("Tracking link copied to clipboard!");
    };

    if (!booking) return null;

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return <Badge variant="outline" className="text-orange-500 border-orange-500">Pending</Badge>;
            case "confirmed":
                return <Badge className="bg-green-500">Confirmed</Badge>;
            case "completed":
                return <Badge className="bg-blue-600">Completed</Badge>;
            case "en_route":
                return <Badge className="bg-blue-400 text-white border-blue-400 animate-pulse">🚚 En Route</Badge>;
            case "in_progress":
                return <Badge className="bg-purple-500 text-white border-purple-500">In Progress</Badge>;
            case "cancelled":
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const bookingDate = new Date(booking.booking_time);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex justify-between items-center pr-8">
                        <DialogTitle className="text-xl">Booking Details</DialogTitle>
                        {getStatusBadge(booking.status)}
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Status Timeline */}
                    <div className="relative flex justify-between px-4 pb-8">
                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200" />

                        {[
                            { id: 'pending', label: 'Pending', active: true },
                            { id: 'confirmed', label: 'Confirmed', active: ['confirmed', 'en_route', 'completed'].includes(booking.status) },
                            ...(booking.booking_type === 'home_service' ? [
                                { id: 'en_route', label: 'En Route', active: ['en_route', 'completed'].includes(booking.status) }
                            ] : []),
                            { id: 'completed', label: 'Done', active: booking.status === 'completed' }
                        ].map((step, i, arr) => (
                            <div key={step.id} className="relative z-10 flex flex-col items-center">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-all duration-500",
                                    step.active
                                        ? "border-blue-600 text-blue-600 shadow-md scale-110"
                                        : "border-gray-300 text-gray-300"
                                )}>
                                    {step.active && step.id === booking.status ? (
                                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                                    ) : (
                                        <span className="text-[10px] font-bold">{i + 1}</span>
                                    )}
                                </div>
                                <span className={cn(
                                    "absolute top-10 text-[10px] whitespace-nowrap font-medium",
                                    step.active ? "text-blue-600" : "text-gray-400"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    {/* Time & Service Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Calendar className="h-4 w-4" />
                                <span>Date</span>
                            </div>
                            <p className="font-semibold">{bookingDate.toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Clock className="h-4 w-4" />
                                <span>Time</span>
                            </div>
                            <p className="font-semibold">{bookingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <Smartphone className="h-4 w-4" />
                            <span>Service Location</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn(
                                "capitalize font-bold",
                                booking.booking_type === "home_service" ? "text-blue-600 border-blue-200 bg-blue-50" : "text-gray-600 border-gray-200 bg-gray-50"
                            )}>
                                {booking.booking_type?.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {booking.booking_type === "home_service"
                                    ? "• We go to the customer"
                                    : "• Customer comes to us"}
                            </span>
                        </div>
                    </div>

                    {booking.booking_type === "home_service" && booking.address_note && (
                        <div className="space-y-1 bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                                <MapPin className="h-4 w-4" />
                                <span>Address Note</span>
                            </div>
                            <p className="text-sm text-blue-900">{booking.address_note}</p>
                        </div>
                    )}

                    {booking.notes && (
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <FileText className="h-4 w-4" />
                                <span>Customer Notes</span>
                            </div>
                            <p className="text-sm border p-2 rounded bg-gray-50 italic">"{booking.notes}"</p>
                        </div>
                    )}

                    {/* Trust Handshake Code */}
                    {booking.status === "confirmed" && booking.verification_code && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <ShieldCheck className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-green-700 font-medium">Trust Handshake Code</p>
                                    <p className="text-lg font-bold text-green-900 tracking-widest">{booking.verification_code}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-green-600 border-green-200">Required at Arrival</Badge>
                        </div>
                    )}

                    {/* Worker Assignment Section */}
                    {booking.booking_type === "home_service" && booking.status !== "completed" && booking.status !== "cancelled" && (
                        <div className="space-y-3 pt-2">
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <User className="h-4 w-4" />
                                    <span>Assigned Staff</span>
                                </div>
                                {booking.worker_id && !isAssigning && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-600 h-8 px-2"
                                        onClick={() => setIsAssigning(true)}
                                    >
                                        Change
                                    </Button>
                                )}
                            </div>

                            {!booking.worker_id || isAssigning ? (
                                <div className="flex gap-2">
                                    <Select
                                        value={assignedWorkerId}
                                        onValueChange={setAssignedWorkerId}
                                    >
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue placeholder="Select a worker to assign" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {workers.length === 0 ? (
                                                <SelectItem value="none" disabled>No online workers available</SelectItem>
                                            ) : (
                                                workers.map(w => (
                                                    <SelectItem key={w.id} value={w.id}>
                                                        {w.name} ({w.worker_status})
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        size="sm"
                                        className="h-10"
                                        disabled={!assignedWorkerId || assignedWorkerId === "none" || !onAssignWorker}
                                        onClick={async () => {
                                            if (onAssignWorker) {
                                                await onAssignWorker(booking.id, assignedWorkerId);
                                                setIsAssigning(false);
                                            }
                                        }}
                                    >
                                        Assign
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {booking.worker_name?.[0] || <User className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{booking.worker_name || "Assigned Worker"}</p>
                                        <p className="text-xs text-gray-500 capitalize">{booking.worker_status || "Active"}</p>
                                    </div>
                                </div>
                            )}

                            {booking.worker_id && booking.status === "confirmed" && (
                                <Button
                                    variant="outline"
                                    className="w-full mt-2 gap-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                                    onClick={handleCopyTrackingLink}
                                >
                                    <Copy className="h-4 w-4" />
                                    Copy Tracking Link for Worker
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {booking.status === "pending" && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            {onReject && (
                                <Button
                                    variant="outline"
                                    className="flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => {
                                        onReject(booking.id);
                                        onClose();
                                    }}
                                >
                                    Reject
                                </Button>
                            )}
                            {onAccept && (
                                <Button
                                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                        onAccept(booking.id);
                                        onClose();
                                    }}
                                >
                                    Confirm Booking
                                </Button>
                            )}
                        </div>
                    )}

                    {onUpdateStatus && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            {booking.status === "confirmed" && booking.booking_type === "home_service" && (
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
                                    disabled={!booking.worker_id}
                                    onClick={() => {
                                        onUpdateStatus(booking.id, "en_route");
                                        onClose();
                                    }}
                                >
                                    <Truck className="h-4 w-4 mr-2" />
                                    {booking.worker_id ? "Start Trip" : "Assign Staff First"}
                                </Button>
                            )}
                            {booking.status === "en_route" && (
                                <Button
                                    className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none"
                                    onClick={() => {
                                        if (booking.booking_type === "home_service") {
                                            const code = window.prompt("Enter customer's 4-digit verification code:");
                                            if (code) {
                                                onUpdateStatus(booking.id, "completed", code);
                                                onClose();
                                            } else {
                                                toast.error("Verification code required for home service");
                                            }
                                        } else {
                                            onUpdateStatus(booking.id, "completed");
                                            onClose();
                                        }
                                    }}
                                >
                                    Mark as Arrived & Completed
                                </Button>
                            )}
                            {booking.status === "confirmed" && booking.booking_type !== "home_service" && (
                                <Button
                                    className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                                    onClick={() => {
                                        onUpdateStatus(booking.id, "completed");
                                        onClose();
                                    }}
                                >
                                    Complete Wash
                                </Button>
                            )}
                        </div>
                    )}
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
