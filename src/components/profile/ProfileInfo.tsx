import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Save, Upload } from "lucide-react";
import { UserProfile } from "@/Contexts/UserService";
import UserService from "@/Contexts/UserService";
import { toast } from "sonner";

interface ProfileInfoProps {
    user: UserProfile;
    onUpdate: (updatedUser: UserProfile) => void;
}

export const ProfileInfo = ({ user, onUpdate }: ProfileInfoProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const [personalInfo, setPersonalInfo] = useState({
        fullName: user.name,
        phone: user.phone,
        // Add other fields if available in future
    });

    const handlePersonalInfoSave = async () => {
        setIsSaving(true);
        try {
            const updatedUser = await UserService.updateUserProfile(user.id, {
                name: personalInfo.fullName,
                phone: personalInfo.phone,
            });
            onUpdate(updatedUser);
            toast.success("Profile updated");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.size <= 5 * 1024 * 1024) {
            try {
                const updatedUser = await UserService.uploadProfilePhoto(user.id, file);
                onUpdate(updatedUser);
                toast.success("Profile photo uploaded");
            } catch (error) {
                toast.error("Failed to upload photo");
            }
        } else {
            toast.error("File must be JPG/PNG and less than 5MB");
        }
    };

    const handleRemovePhoto = async () => {
        try {
            const updatedUser = await UserService.deleteProfilePhoto(user.id);
            onUpdate(updatedUser);
            toast.success("Profile photo removed");
        } catch (error) {
            toast.error("Failed to remove photo");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <p className="text-sm text-[#6B7280]">
                    Update your personal details and profile picture
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                    <div className="relative w-[120px] h-[120px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {user.profile_photo ? (
                            <img
                                src={user.profile_photo}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl font-semibold">{user.name?.charAt(0)}</span>
                        )}
                        <input
                            type="file"
                            accept="image/jpeg,image/png"
                            className="hidden"
                            id="photo-upload"
                            onChange={handlePhotoUpload}
                        />
                        <label
                            htmlFor="photo-upload"
                            className="absolute bottom-0 right-0 bg-[#2563EB] text-white p-2 rounded-full cursor-pointer hover:bg-[#1D4ED8]"
                        >
                            <Upload className="h-4 w-4" />
                        </label>
                    </div>
                    {user.profile_photo && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-[#EF4444] border-[#EF4444]"
                            onClick={handleRemovePhoto}
                        >
                            Remove Photo
                        </Button>
                    )}
                </div>

                {/* Form Fields */}
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="font-semibold">
                            Full Name <span className="text-[#EF4444]">*</span>
                        </Label>
                        <Input
                            id="fullName"
                            value={personalInfo.fullName}
                            onChange={(e) =>
                                setPersonalInfo({ ...personalInfo, fullName: e.target.value })
                            }
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="font-semibold">
                            Email Address <span className="text-[#EF4444]">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="email"
                                value={user.email}
                                disabled
                                className="pr-10"
                            />
                            <Shield className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                        </div>
                        <p className="text-xs text-[#6B7280]">
                            Email cannot be changed (linked to Google account)
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="font-semibold">
                            Phone Number <span className="text-[#EF4444]">*</span>
                        </Label>
                        <Input
                            id="phone"
                            value={personalInfo.phone}
                            onChange={(e) =>
                                setPersonalInfo({ ...personalInfo, phone: e.target.value })
                            }
                            placeholder="+234 801 234 5678"
                            required
                        />
                        <p className="text-xs text-[#6B7280]">
                            Used for booking confirmations and updates
                        </p>
                    </div>
                </div>

                <Button
                    className="w-full sm:w-auto"
                    onClick={handlePersonalInfoSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>
                            <svg
                                className="animate-spin h-5 w-5 mr-2"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                                ></path>
                            </svg>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};
