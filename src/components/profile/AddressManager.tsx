import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import UserService, { UserProfile, UserAddress } from "@/Contexts/UserService";
import { LocationSearchBar } from "@/components/LocationSearchBar";

interface AddressManagerProps {
    user: UserProfile;
    onUpdate: (updatedUser: UserProfile) => void;
}

export const AddressManager = ({ user, onUpdate }: AddressManagerProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const [showAddAddress, setShowAddAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: "Home",
        address: "",
        area: "",
        city: "",
        state: "",
        postalCode: "",
        phone: "",
        instructions: "",
        isDefault: false,
        coordinates: [0, 0] as [number, number]
    });

    const handleAddAddress = async () => {
        setIsSaving(true);
        try {
            const addressData: UserAddress = {
                type: newAddress.label.toLowerCase(),
                label: newAddress.label,
                address_line: newAddress.address, // Use full address from Mapbox
                city: newAddress.city,
                state: newAddress.state,
                country: "Nigeria",
                is_default: newAddress.isDefault,
                location: {
                    type: "Point",
                    coordinates: newAddress.coordinates
                }
            };

            await UserService.addUserAddress(user.id, addressData);

            const updatedUser = await UserService.getUserProfile(user.id);
            onUpdate(updatedUser);

            setShowAddAddress(false);
            setNewAddress({
                label: "Home",
                address: "",
                area: "",
                city: "",
                state: "",
                postalCode: "",
                phone: "",
                instructions: "",
                isDefault: false,
                coordinates: [0, 0]
            });
            toast.success("Address added");
        } catch (error) {
            toast.error("Failed to add address");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            await UserService.deleteUserAddress(user.id, id);
            const updatedUser = await UserService.getUserProfile(user.id);
            onUpdate(updatedUser);
            toast.success("Address deleted");
        } catch (error) {
            toast.error("Failed to delete address");
        }
    };

    const handleSetDefaultAddress = async (id: string) => {
        try {
            await UserService.setDefaultAddress(user.id, id);
            const updatedUser = await UserService.getUserProfile(user.id);
            onUpdate(updatedUser);
            toast.success("Default address updated");
        } catch (error) {
            toast.error("Failed to set default address");
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Saved Addresses
                        <Button onClick={() => setShowAddAddress(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Address
                        </Button>
                    </CardTitle>
                    <p className="text-sm text-[#6B7280]">
                        Manage addresses for home service bookings
                    </p>
                </CardHeader>
                <CardContent>
                    {!user.addresses || user.addresses.length === 0 ? (
                        <div className="text-center py-8">
                            <MapPin className="h-12 w-12 mx-auto text-[#6B7280]" />
                            <h3 className="mt-4 text-lg font-semibold">No saved addresses</h3>
                            <p className="text-sm text-[#6B7280] mb-4">
                                Add addresses for faster home service bookings
                            </p>
                            <Button onClick={() => setShowAddAddress(true)}>
                                Add Your First Address
                            </Button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {user.addresses.map((addr) => (
                                <Card key={addr.id} className={`${addr.is_default ? "border-l-4 border-[#2563EB]" : ""}`}>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-lg">{addr.label || addr.type}</span>
                                                {addr.is_default && (
                                                    <Badge className="bg-[#2563EB] text-white">DEFAULT</Badge>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-[#EF4444]"
                                                    onClick={() => handleDeleteAddress(addr.id || "")}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-[#6B7280]">{addr.address_line}</p>
                                        <p className="text-sm text-[#6B7280] mt-1">{addr.city}, {addr.state}</p>
                                        {!addr.is_default && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-4"
                                                onClick={() => handleSetDefaultAddress(addr.id || "")}
                                            >
                                                Set as Default
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Address Modal */}
            <Dialog open={showAddAddress} onOpenChange={setShowAddAddress}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Address</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="label">Label</Label>
                            <Select
                                value={newAddress.label}
                                onValueChange={(value) => setNewAddress({ ...newAddress, label: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select label" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Home">Home</SelectItem>
                                    <SelectItem value="Work">Work</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Search Address</Label>
                            <LocationSearchBar
                                onPlaceSelected={(lat, lng, address) => {
                                    setNewAddress(prev => ({
                                        ...prev,
                                        address: address,
                                        coordinates: [lng, lat],
                                        // Attempt to extract city/state basically? 
                                        // For now, let user fill city/state to be precise
                                    }));
                                }}
                                placeholder="Search for location..."
                                className="w-full"
                            />
                            {newAddress.address && (
                                <p className="text-sm text-green-600 mt-1">
                                    Selected: {newAddress.address}
                                </p>
                            )}
                        </div>
                        {/* 
                          We remove simple "Street Address" textarea since we use search. 
                          But we might want allow manual edit? 
                          We store the result in newAddress.address.
                        */}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="area">Area/Landmark</Label>
                                <Input
                                    id="area"
                                    value={newAddress.area}
                                    onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={newAddress.city}
                                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Select
                                    value={newAddress.state}
                                    onValueChange={(value) => setNewAddress({ ...newAddress, state: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Lagos">Lagos</SelectItem>
                                        <SelectItem value="Abuja">Abuja</SelectItem>
                                        <SelectItem value="Ogun">Ogun</SelectItem>
                                        <SelectItem value="Oyo">Oyo</SelectItem>
                                        <SelectItem value="Rivers">Rivers</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                                <Input
                                    id="postalCode"
                                    value={newAddress.postalCode}
                                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={newAddress.phone}
                                onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                placeholder="+234 801 234 5678"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instructions">Special Instructions</Label>
                            <Textarea
                                id="instructions"
                                value={newAddress.instructions}
                                onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })}
                                placeholder="e.g., Gate code: 1234"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isDefault"
                                checked={newAddress.isDefault}
                                onCheckedChange={(checked) =>
                                    setNewAddress({ ...newAddress, isDefault: !!checked })
                                }
                            />
                            <Label htmlFor="isDefault">Set as default</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddAddress(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddAddress} disabled={isSaving || !newAddress.address}>
                            {isSaving ? "Saving..." : "Save Address"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
