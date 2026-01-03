import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Truck, CheckCircle, Navigation, Loader2 } from "lucide-react";
import axios from "axios";
import API_BASE_URL from "@/Contexts/baseUrl";
import { toast } from "sonner";

const WorkerTrackPage = () => {
    const { id } = useParams();
    const [booking, setBooking] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTracking, setIsTracking] = useState(false);
    const [currentPos, setCurrentPos] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/bookings/track/${id}`);
                setBooking(response.data.data || response.data);
            } catch (error) {
                console.error("Failed to fetch booking details:", error);
                toast.error("Could not load booking details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchBooking();
    }, [id]);

    useEffect(() => {
        let watchId: number;

        if (isTracking && navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentPos({ lat: latitude, lng: longitude });

                    // Push to backend
                    axios.patch(`${API_BASE_URL}/bookings/track/${id}/location`, {
                        lat: latitude,
                        lng: longitude
                    }).catch(err => console.error("Location update failed:", err));
                },
                (error) => console.error("GPS Watch Error:", error),
                { enableHighAccuracy: true, maximumAge: 5000 }
            );
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [isTracking, id]);

    const handleStartTrip = async () => {
        try {
            await axios.patch(`${API_BASE_URL}/bookings/track/${id}/status`, { status: "en_route" });
            setIsTracking(true);
            setBooking(prev => ({ ...prev, status: "en_route" }));
            toast.success("Trip started! Your location is being shared.");
        } catch (error) {
            toast.error("Failed to start trip");
        }
    };

    const handleArrive = async () => {
        try {
            await axios.patch(`${API_BASE_URL}/bookings/track/${id}/status`, { status: "completed" });
            setIsTracking(false);
            setBooking(prev => ({ ...prev, status: "completed" }));
            toast.success("Job marked as arrived/completed!");
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center py-8">
                    <CardTitle className="text-red-500">Booking Not Found</CardTitle>
                    <p className="text-muted-foreground mt-2">This link may be expired or invalid.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Worker Dispatch</h1>
                    <p className="text-sm text-gray-500">Magic Link Tracking Page</p>
                </div>

                <Card className="border-t-4 border-t-primary shadow-xl">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <Badge variant={booking.status === "en_route" ? "default" : "secondary"} className="capitalize">
                                {booking.status.replace("_", " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">ID: {id?.slice(-6).toUpperCase()}</span>
                        </div>
                        <CardTitle className="text-xl pt-2">Service Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <User className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-xs text-blue-600 font-medium tracking-tight">CUSTOMER</p>
                                <p className="font-bold text-blue-900">{booking.customer_name || "Guest User"}</p>
                            </div>
                        </div>

                        {booking.address_note && (
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
                                <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">LOCATION NOTE</p>
                                    <p className="text-sm font-medium">{booking.address_note}</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 space-y-3">
                            {booking.status === "confirmed" && (
                                <Button className="w-full h-14 text-lg font-bold gap-2 shadow-lg" onClick={handleStartTrip}>
                                    <Navigation className="h-5 w-5" />
                                    START TRIP
                                </Button>
                            )}

                            {booking.status === "en_route" && (
                                <>
                                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-center animate-pulse">
                                        <p className="text-xs text-yellow-700 font-bold uppercase tracking-widest">Live Tracking Active</p>
                                        <p className="text-[10px] text-yellow-600 mt-1">Please keep this page open while driving</p>
                                    </div>
                                    <Button className="w-full h-14 text-lg font-bold gap-2 bg-purple-600 hover:bg-purple-700 shadow-lg" onClick={handleArrive}>
                                        <CheckCircle className="h-5 w-5" />
                                        I HAVE ARRIVED
                                    </Button>
                                </>
                            )}

                            {booking.status === "completed" && (
                                <div className="text-center py-6">
                                    <div className="bg-green-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-green-700">Service Finished!</h2>
                                    <p className="text-sm text-gray-500 mt-1">Excellent work. You can close this tab now.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="text-center pt-8 border-t border-gray-200">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border rounded-full shadow-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Handshake System V1.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkerTrackPage;
