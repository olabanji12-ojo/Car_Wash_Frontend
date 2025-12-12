import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const SecuritySettings = () => {
    const navigate = useNavigate();
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

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Security & Privacy</CardTitle>
                    <p className="text-sm text-[#6B7280]">
                        Manage your account security and privacy settings
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-semibold">Change Password</h4>
                        <p className="text-sm text-[#6B7280] mb-2">
                            You signed in with Google. Password management is handled by Google.
                        </p>
                        <Button variant="outline" asChild>
                            <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer">
                                Manage Google Account
                            </a>
                        </Button>
                    </div>
                    <div>
                        <h4 className="font-semibold">Two-Factor Authentication</h4>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-[#6B7280]">
                                Add an extra layer of security
                            </p>
                            <Badge variant="outline">Not Enabled</Badge>
                        </div>
                        <Switch disabled />
                    </div>
                    <div>
                        <h4 className="font-semibold">Data Sharing</h4>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-[#6B7280]">
                                Help us improve by sharing anonymous usage statistics
                            </p>
                            <Switch />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold">Profile Visibility</h4>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-[#6B7280]">
                                Allow carwash businesses to see your booking history
                            </p>
                            <Switch />
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-semibold text-[#EF4444]">Danger Zone</h4>
                        <p className="text-sm text-[#6B7280] mb-2">
                            Once you delete your account, there is no going back. Please be certain.
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
