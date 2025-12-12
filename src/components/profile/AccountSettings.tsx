import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LogOut } from "lucide-react";
import { UserProfile } from "@/Contexts/UserService";
import { useAuth } from "@/Contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AccountSettingsProps {
    user: UserProfile;
}

export const AccountSettings = ({ user }: AccountSettingsProps) => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    const handleDeleteAccount = () => {
        if (deleteConfirmText.toUpperCase() === "DELETE") {
            toast.success("Account deletion request sent");
            setShowDeleteDialog(false);
            setTimeout(() => navigate("/"), 2000);
        } else {
            toast.error("Please type DELETE to confirm");
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Account Management</CardTitle>
                    <p className="text-sm text-[#6B7280]">
                        Manage your account and data
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-semibold">Account Information</h4>
                        <div className="space-y-2 text-sm text-[#6B7280]">
                            <p>Account Created: {user.accountCreated ? new Date(user.accountCreated).toLocaleDateString() : 'N/A'}</p>
                            <p>Account Type: Personal Account</p>
                            <p>Total Bookings: {user.totalBookings} completed services</p>
                            <p>Email: {user.email}</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold">Data & Privacy</h4>
                        <Button variant="outline" className="mt-2">
                            Download My Data
                        </Button>
                        <div className="mt-4 space-y-2 text-sm">
                            <a href="/privacy-policy" className="text-[#2563EB] hover:underline">
                                Privacy Policy
                            </a>
                            <br />
                            <a href="/terms-of-service" className="text-[#2563EB] hover:underline">
                                Terms of Service
                            </a>
                            <br />
                            <a href="/cookie-policy" className="text-[#2563EB] hover:underline">
                                Cookie Policy
                            </a>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-semibold">Logout</h4>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                    <div>
                        <h4 className="font-semibold text-[#EF4444]">Delete Account</h4>
                        <p className="text-sm text-[#6B7280] mb-2">
                            This action cannot be undone
                        </p>
                        <Button
                            variant="outline"
                            className="text-[#EF4444] border-[#EF4444]"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            Delete Account
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                        <DialogDescription>
                            This will permanently delete all your data. Type DELETE to confirm.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE to confirm"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText.toUpperCase() !== "DELETE"}
                        >
                            Delete My Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
